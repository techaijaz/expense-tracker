import quiker from '../util/quiker.js'
import databseService from '../service/databseService.js'

import { validateJoiSchema, validationRegisterBody, validationLoginBody } from '../service/validationService.js'
import responceseMessage from '../constent/responceseMessage.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import config from '../config/config.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import { EApplicationEnvionment } from '../constent/application.js'

dayjs.extend(utc)

export default {
    register: async (req, res, next) => {
        try {
            const { body } = req

            // Todo
            // * body validation
            const { error, value } = validateJoiSchema(validationRegisterBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { name, email, password, consent } = value

            // * check if user already exist using
            const user = await databseService.findUserByEmail(email)
            if (user) {
                return httpError(next, responceseMessage.ALREADY_EXIST('User', email), req, 422)
            }

            // * encrypt password
            const encryptedPassword = await quiker.hashedPassword(password)
            //const token = quiker.generateRandumId()
            //const code = quiker.generateOtp(6)

            // * create user
            const payload = {
                name,
                email,
                password: encryptedPassword,
                consent,
            }
            const newUser = await databseService.registerUser(payload)

            httpResponse(req, res, 201, responceseMessage.SUCCESS, { _id: newUser._id, email: newUser.email })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    login: async (req, res, next) => {
        try {
            // TODO
            // * validate and parse body
            const { body } = req
            const { error, value } = validateJoiSchema(validationLoginBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { email, password } = value
            // * finnd user by email
            const user = await databseService.findUserByEmail(email, '+password')
            // * validate password
            if (!user) {
                return httpError(next, new Error(responceseMessage.NOT_FOUND('User')), req, 404)
            }
            const isPasswordMatch = await quiker.comparePassword(password, user.password)
            if (!isPasswordMatch) {
                return httpError(next, new Error(responceseMessage.INVALID_CREDENTIALS), req, 404)
            }
            // * generate token
            const accessToken = quiker.genrateToken({ userId: user._id, role: user.role }, config.ACCESS_TOKEN.SECRET, config.ACCESS_TOKEN.EXPIRY)

            const refreshToken = quiker.genrateToken({ userId: user._id, role: user.role }, config.REFRESH_TOKEN.SECRET, config.REFRESH_TOKEN.EXPIRY)
            // * last login
            user.lastLoginAt = dayjs().utc().toDate()
            await user.save()
            // * tokens save

            user.refreshToken.token = refreshToken
            await user.save()

            // * get Accounts
            const accounts = await databseService.getAccountsByUserId(user._id)
            // * get categories
            const categories = await databseService.getAllCategories(user._id)
            // * cookie send
            const DOMAIN = quiker.getDomainFromUrl(config.SERVER_URL)

            res.cookie('accessToken', accessToken, {
                path: '/api/v1',
                domain: DOMAIN,
                sameSite: 'strict',
                maxAge: 10000 * config.ACCESS_TOKEN.EXPIRY,
                httpOnly: true,
                secure: !(config.ENV === EApplicationEnvionment.PRODUCTION),
            }).cookie('refreshToken', refreshToken, {
                path: '/api/v1',
                domain: DOMAIN,
                sameSite: 'strict',
                maxAge: 10000 * config.REFRESH_TOKEN.EXPIRY,
                httpOnly: true,
                secure: !(config.ENV === EApplicationEnvionment.PRODUCTION),
            })
            if (!user.setBasicDetails) {
                databseService.setDefaultData(user._id)
            }
            httpResponse(req, res, 200, responceseMessage.SUCCESS, {
                accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    consent: user.consent,
                    setBasicDetails: user.setBasicDetails,
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

            if (refreshToken) {
                await databseService.deleteRefreshToken(refreshToken)
            }
            const DOMAIN = quiker.getDomainFromUrl(config.SERVER_URL)
            res.clearCookie('accessToken', {
                path: '/api/v1',
                domain: DOMAIN,
                sameSite: 'strict',
                maxAge: 10000 * config.ACCESS_TOKEN.EXPIRY,
                httpOnly: true,
                secure: !(config.ENV === EApplicationEnvionment.PRODUCTION),
            }).clearCookie('refreshToken', {
                path: '/api/v1',
                domain: DOMAIN,
                sameSite: 'strict',
                maxAge: 10000 * config.REFRESH_TOKEN.EXPIRY,
                httpOnly: true,
                secure: !(config.ENV === EApplicationEnvionment.PRODUCTION),
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
    refresshToken: async (req, res, next) => {
        try {
            const { cookies } = req
            const { refreshToken } = cookies

            // if (accessToken) {
            //     return httpResponse(req, res, 200, responceseMessage.SUCCESS, { accessToken })
            // }
            if (refreshToken) {
                const rft = await databseService.getRefreshTokan(refreshToken)
                if (rft) {
                    const DOMAIN = quiker.getDomainFromUrl(config.SERVER_URL)
                    let userId = null
                    let role = null
                    const decryptedjwt = quiker.verifyToken(refreshToken, config.REFRESH_TOKEN.SECRET)
                    userId = decryptedjwt.userId
                    role = decryptedjwt.role
                    if (userId) {
                        const accessToken = quiker.genrateToken(
                            { userId: userId, role: role },
                            config.ACCESS_TOKEN.SECRET,
                            config.ACCESS_TOKEN.EXPIRY
                        )

                        res.cookie('accessToken', accessToken, {
                            path: '/api/v1',
                            domain: DOMAIN,
                            sameSite: 'strict',
                            maxAge: 10000 * config.ACCESS_TOKEN.EXPIRY,
                            httpOnly: true,
                            secure: !(config.ENV === EApplicationEnvionment.PRODUCTION),
                        })
                        return httpResponse(req, res, 200, responceseMessage.SUCCESS, { accessToken })
                    }
                    return httpError(next, new Error(responceseMessage.UNAUTHORIZED), req, 404)
                }
            }
            return httpError(next, new Error(responceseMessage.UNAUTHORIZED), req, 404)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
