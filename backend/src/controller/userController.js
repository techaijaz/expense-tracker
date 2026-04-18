import quiker from '../util/quiker.js'
import databseService from '../service/databseService.js'
import {
    validateJoiSchema,
    validationRegisterBody,
    validationLoginBody,
    validationChangePasswordBody,
    validationPreferencesBody,
} from '../service/validationService.js'
import responceseMessage from '../constent/responceseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import config from '../config/config.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import { EApplicationEnvionment } from '../constent/application.js'
import userModel from '../model/userModel.js'
import accountModel from '../model/accountModel.js'
import categoryModel from '../model/categoryModel.js'
import partiesModel from '../model/partiesModel.js'
import transactionModel from '../model/transactionModel.js'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'

dayjs.extend(utc)

export default {
    register: async (req, res, next) => {
        try {
            const { body } = req
            const { error, value } = validateJoiSchema(validationRegisterBody, body)
            if (error) return httpError(next, error, req, 422)

            const { firstName, lastName, email, password, consent } = value
            const user = await databseService.findUserByEmail(email)
            if (user) return httpError(next, responceseMessage.ALREADY_EXIST('User', email), req, 422)

            const encryptedPassword = await quiker.hashedPassword(password)
            const payload = { firstName, lastName, email, password: encryptedPassword, consent }
            const newUser = await databseService.registerUser(payload)
            httpResponse(req, res, 201, responceseMessage.SUCCESS, { _id: newUser._id, email: newUser.email })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    login: async (req, res, next) => {
        try {
            const { body } = req
            const { error, value } = validateJoiSchema(validationLoginBody, body)
            if (error) return httpError(next, error, req, 422)

            const { email, password } = value
            const user = await databseService.findUserByEmail(email, '+password')
            if (!user) return httpError(next, new Error(responceseMessage.INVALID_CREDENTIALS), req, 401)

            const isPasswordMatch = await quiker.comparePassword(password, user.password)
            if (!isPasswordMatch) return httpError(next, new Error(responceseMessage.INVALID_CREDENTIALS), req, 401)

            const accessToken = quiker.genrateToken({ userId: user._id, role: user.role }, config.ACCESS_TOKEN.SECRET, config.ACCESS_TOKEN.EXPIRY)
            const refreshToken = quiker.genrateToken({ userId: user._id, role: user.role }, config.REFRESH_TOKEN.SECRET, config.REFRESH_TOKEN.EXPIRY)

            user.lastLoginAt = dayjs().utc().toDate()
            user.refreshToken.token = refreshToken
            await user.save()

            if (!user.setBasicDetails) {
                await databseService.setDefaultData(user._id)
            }

            const accounts = await databseService.getAccountsByUserId(user._id)
            const allCategories = await databseService.getAllCategories(user._id)
            const categories = allCategories.reduce(
                (acc, cat) => {
                    acc[cat.type].push(cat)
                    return acc
                },
                { INCOME: [], EXPENSE: [], TRANSFER: [] }
            )
            const DOMAIN = quiker.getDomainFromUrl(config.SERVER_URL)

            res.cookie('accessToken', accessToken, {
                path: '/',
                sameSite: 'lax',
                maxAge: 1000 * config.ACCESS_TOKEN.EXPIRY,
                httpOnly: true,
                secure: config.ENV === EApplicationEnvionment.PRODUCTION,
            }).cookie('refreshToken', refreshToken, {
                path: '/',
                sameSite: 'lax',
                maxAge: 1000 * config.REFRESH_TOKEN.EXPIRY,
                httpOnly: true,
                secure: config.ENV === EApplicationEnvionment.PRODUCTION,
            })

            httpResponse(req, res, 200, responceseMessage.SUCCESS, {
                accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar,
                    consent: user.consent,
                    setBasicDetails: user.setBasicDetails,
                    lastLoginAt: user.lastLoginAt,
                    preferences: user.preferences,
                    plan: user.plan || 'basic',
                    onboardingDone: user.onboardingDone || false,
                },
                accounts,
                categories,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    logout: async (req, res, next) => {
        try {
            const { cookies } = req
            const { refreshToken } = cookies
            if (refreshToken) await databseService.deleteRefreshToken(refreshToken)

            const DOMAIN = quiker.getDomainFromUrl(config.SERVER_URL)
            res.clearCookie('accessToken', {
                path: '/',
                sameSite: 'lax',
                maxAge: 1000 * config.ACCESS_TOKEN.EXPIRY,
                httpOnly: true,
                secure: config.ENV === EApplicationEnvionment.PRODUCTION,
            }).clearCookie('refreshToken', {
                path: '/',
                sameSite: 'lax',
                maxAge: 1000 * config.REFRESH_TOKEN.EXPIRY,
                httpOnly: true,
                secure: config.ENV === EApplicationEnvionment.PRODUCTION,
            })
            httpResponse(req, res, 200, responceseMessage.SUCCESS, null)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    selfIdentification: async (req, res, next) => {
        try {
            const { authenticatedUser } = req
            httpResponse(req, res, 200, responceseMessage.SUCCESS, authenticatedUser)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    refreshToken: async (req, res, next) => {
        try {
            const { cookies } = req
            const { refreshToken } = cookies
            if (refreshToken) {
                const rft = await databseService.getRefreshToken(refreshToken)
                if (rft) {
                    const DOMAIN = quiker.getDomainFromUrl(config.SERVER_URL)
                    const decryptedjwt = quiker.verifyToken(refreshToken, config.REFRESH_TOKEN.SECRET)
                    const { userId, role } = decryptedjwt
                    if (userId) {
                        const accessToken = quiker.genrateToken({ userId, role }, config.ACCESS_TOKEN.SECRET, config.ACCESS_TOKEN.EXPIRY)
                        res.cookie('accessToken', accessToken, {
                            path: '/',
                            sameSite: 'lax',
                            maxAge: 1000 * config.ACCESS_TOKEN.EXPIRY,
                            httpOnly: true,
                            secure: config.ENV === EApplicationEnvionment.PRODUCTION,
                        })
                        return httpResponse(req, res, 200, responceseMessage.SUCCESS, { accessToken })
                    }
                    return httpError(next, new Error(responceseMessage.UNAUTHORIZED), req, 401)
                }
            }
            return httpError(next, new Error(responceseMessage.UNAUTHORIZED), req, 401)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationChangePasswordBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const { currentPassword, newPassword } = value
            const user = await userModel.findById(req.authenticatedUser._id).select('+password')
            if (!user) return httpError(next, new Error('User not found'), req, 404)

            const isMatch = await quiker.comparePassword(currentPassword, user.password)
            if (!isMatch) return httpError(next, new Error('Current password is incorrect'), req, 401)

            user.password = await quiker.hashedPassword(newPassword)
            await user.save()
            httpResponse(req, res, 200, 'Password changed successfully', null)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    uploadAvatarHandler: async (req, res, next) => {
        try {
            if (!req.file) return httpError(next, new Error('No file uploaded'), req, 400)

            const userId = req.authenticatedUser._id
            const user = await userModel.findById(userId)

            // Delete old avatar file if it exists
            if (user.avatar) {
                const oldPath = path.join(process.cwd(), 'public', user.avatar)
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
            }

            // Store relative URL path
            const avatarUrl = `/uploads/avatars/${req.file.filename}`
            user.avatar = avatarUrl
            await user.save()

            httpResponse(req, res, 200, 'Avatar updated successfully', { avatar: avatarUrl })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updatePreferences: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationPreferencesBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const user = await userModel.findByIdAndUpdate(
                req.authenticatedUser._id,
                { $set: { preferences: { ...req.authenticatedUser.preferences, ...value } } },
                { new: true }
            )
            httpResponse(req, res, 200, 'Preferences updated successfully', { preferences: user.preferences })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    completeOnboarding: async (req, res, next) => {
        try {
            const user = await userModel.findByIdAndUpdate(
                req.authenticatedUser._id,
                { $set: { onboardingDone: true } },
                { new: true }
            )
            httpResponse(req, res, 200, 'Onboarding completed successfully', { onboardingDone: user.onboardingDone })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getStorageStats: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const objectId = new mongoose.Types.ObjectId(userId)
            const filter = { userId: objectId, isDeleted: false }

            const [accounts, categories, parties, transactions] = await Promise.all([
                accountModel.countDocuments(filter),
                categoryModel.countDocuments(filter),
                partiesModel.countDocuments(filter),
                transactionModel.countDocuments(filter),
            ])

            const total = accounts + categories + parties + transactions
            // Estimate ~500 bytes per doc average
            const estimatedBytes = total * 500
            const usagePercent = Math.min(Math.round((total / 5000) * 100), 100) // assume 5000 docs = 100%

            httpResponse(req, res, 200, 'Storage stats retrieved', {
                transactions, // High-level entries
                accounts,
                categories,
                parties,
                totalDocuments: total,
                estimatedBytes,
                usagePercent,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    hardReset: async (req, res, next) => {
        try {
            const { password } = req.body
            if (!password) return httpError(next, new Error('Password is required'), req, 400)

            const user = await userModel.findById(req.authenticatedUser._id).select('+password')
            if (!user) return httpError(next, new Error('User not found'), req, 404)

            const isMatch = await quiker.comparePassword(password, user.password)
            if (!isMatch) return httpError(next, new Error('Incorrect password. Reset aborted.'), req, 401)

            const userId = req.authenticatedUser._id

            await Promise.all([
                transactionModel.deleteMany({ userId }),
                categoryModel.deleteMany({ userId }),
                partiesModel.deleteMany({ userId }),
                accountModel.deleteMany({ userId }),
            ])

            // Reset the setBasicDetails flag so defaults get recreated on next login
            user.setBasicDetails = false
            await user.save()

            httpResponse(req, res, 200, 'All user data has been permanently deleted', null)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    exportData: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const format = req.query.format || 'json'
            const dateStr = dayjs().format('YYYY-MM-DD')

            const [transactions, accounts, categories, parties] = await Promise.all([
                transactionModel.find({ userId }).populate('accountId', 'name type').populate('categoryId', 'name type').populate('partyId', 'name relation').lean(),
                accountModel.find({ userId }).lean(),
                categoryModel.find({ userId }).lean(),
                partiesModel.find({ userId }).lean(),
            ])

            if (format === 'csv') {
                // Build CSV for transaction entries
                const rows = transactions.map((t) => ({
                    Date: dayjs(t.date).format('YYYY-MM-DD'),
                    Title: t.title || '',
                    Amount: t.amount,
                    Type: t.type,
                    Category: t.categoryId?.name || '',
                    Counterparty: t.partyId?.name || '',
                }))

                const headers = ['Date', 'Title', 'Amount', 'Type', 'Category', 'Counterparty']
                const csvContent = [
                    headers.join(','),
                    ...rows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(',')),
                ].join('\r\n')

                res.setHeader('Content-Type', 'text/csv')
                res.setHeader('Content-Disposition', `attachment; filename="aiexpenser_export_${dateStr}.csv"`)
                return res.send(csvContent)
            }

            // JSON export
            const exportData = {
                exportedAt: new Date().toISOString(),
                user: {
                    email: req.authenticatedUser.email,
                    firstName: req.authenticatedUser.firstName,
                    lastName: req.authenticatedUser.lastName,
                },
                summary: {
                    accounts: accounts.length,
                    categories: categories.length,
                    parties: parties.length,
                    transactions: transactions.length,
                },
                accounts,
                categories,
                parties,
                transactions,
            }

            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Content-Disposition', `attachment; filename="aiexpenser_export_${dateStr}.json"`)
            return res.json(exportData)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}


