import mongoose from 'mongoose'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Account from '../model/accountModel.js'
import userModel from '../model/userModel.js'
import { validateJoiSchema, validationAccountBody } from '../service/validationService.js'
import logger from '../util/loger.js'

const ACCOUNT_NUMBER_TYPES = ['BANK', 'CREDIT_CARD']

export default {
    createAccount: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationAccountBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const userId = req.authenticatedUser._id

            // Only 1 CASH account allowed per user
            if (value.type === 'CASH') {
                const cashCount = await Account.countDocuments({ userId, type: 'CASH', isDeleted: false })
                if (cashCount >= 1) {
                    return httpError(next, new Error('Only one Cash account is allowed per user.'), req, 409)
                }
                value.isCash = true // Force isCash for CASH type
            } else {
                value.isCash = false // Ensure isCash is false for other types
            }

            // PRO subscription enforcement: BASIC users can only have 1 BANK account
            if (value.type === 'BANK') {
                const user = await userModel.findById(userId).select('plan')
                const plan = user?.plan || 'basic'
                if (plan === 'basic') {
                    const bankCount = await Account.countDocuments({ userId, type: 'BANK', isDeleted: false })
                    if (bankCount >= 1) {
                        return httpError(next, new Error('PRO subscription required to add more than 1 bank account.'), req, 403)
                    }
                }
            }

            // Unique accountNumber check for BANK / CREDIT_CARD / WALLET
            if (value.accountNumber) {
                const existing = await Account.findOne({
                    userId,
                    accountNumber: value.accountNumber,
                    isDeleted: false,
                })
                if (existing) {
                    return httpError(next, new Error('An account with this account number already exists.'), req, 409)
                }
            }

            // If this account is being set as default, unset all others first
            if (value.isDefault) {
                await Account.updateMany({ userId, isDeleted: false }, { $set: { isDefault: false } })
            }

            // Start account with 0 balance if we're going to create an opening balance transaction
            const initialBalance = value.balance || 0
            const account = await Account.create({ ...value, balance: 0, userId })

            // Handle Opening Balance
            if (initialBalance > 0) {
                let category = await mongoose.model('Category').findOne({ userId, name: 'Opening Balance', isDeleted: false })
                if (!category) {
                    category = await mongoose.model('Category').create({
                        userId,
                        name: 'Opening Balance',
                        type: 'INCOME',
                    })
                }

                // Create initial transaction directly
                await mongoose.model('Transaction').create({
                    userId,
                    accountId: account._id,
                    type: 'income',
                    amount: initialBalance,
                    title: 'Opening Balance',
                    date: new Date(),
                    categoryId: category._id,
                    notes: 'Initial balance at account creation',
                    balanceSnapshot: initialBalance,
                })

                // Update account balance
                account.balance = initialBalance
                await account.save()
            }

            httpResponse(req, res, 201, 'Account created successfully', account)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getAllAccounts: async (req, res, next) => {
        try {
            const accounts = await Account.find({
                userId: req.authenticatedUser._id,
                isDeleted: false,
            }).sort({ isDefault: -1, createdAt: -1 })
            httpResponse(req, res, 200, 'Accounts retrieved successfully', accounts)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateAccount: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { isActive, isDefault, accountNumber, name, balance, creditLimit } = req.body

            // Find current account
            const current = await Account.findOne({ _id: req.params.id, userId, isDeleted: false })
            if (!current) return httpError(next, new Error('Account not found'), req, 404)

            // Block CASH account from being made inactive
            if (current.type === 'CASH' && isActive === false) {
                return httpError(next, new Error('Cash account cannot be set to inactive.'), req, 400)
            }

            // Guard for unique accountNumber on change
            if (accountNumber && accountNumber !== current.accountNumber) {
                const existing = await Account.findOne({
                    userId,
                    accountNumber,
                    _id: { $ne: req.params.id },
                    isDeleted: false,
                })
                if (existing) {
                    return httpError(next, new Error('An account with this account number already exists.'), req, 409)
                }
            }

            const updateFields = {}
            if (isActive !== undefined) updateFields.isActive = isActive
            if (isDefault !== undefined) updateFields.isDefault = isDefault
            if (accountNumber !== undefined) updateFields.accountNumber = accountNumber
            if (name !== undefined) updateFields.name = name
            if (creditLimit !== undefined) updateFields.creditLimit = creditLimit

            // Handle "Opening Balance" edit
            if (balance !== undefined) {
                const Transaction = mongoose.model('Transaction')

                // Find the initial transaction
                const initialTransaction = await Transaction.findOne({
                    accountId: req.params.id,
                    userId,
                    title: 'Opening Balance',
                    notes: 'Initial balance at account creation',
                })

                if (initialTransaction) {
                    const diff = Number(balance) - initialTransaction.amount

                    // Update Transaction
                    initialTransaction.amount = Number(balance)
                    initialTransaction.balanceSnapshot += diff
                    await initialTransaction.save()

                    // Update Account Balance by diff
                    updateFields.balance = current.balance + diff
                } else if (Number(balance) !== 0) {
                    // No initial transaction found (it was 0), create one if new balance is non-zero
                    let category = await mongoose.model('Category').findOne({ userId, name: 'Opening Balance', isDeleted: false })
                    if (!category) {
                        category = await mongoose.model('Category').create({ userId, name: 'Opening Balance', type: 'INCOME' })
                    }
                    
                    await Transaction.create({
                        userId,
                        accountId: req.params.id,
                        type: 'income',
                        amount: Number(balance),
                        title: 'Opening Balance',
                        date: new Date(),
                        categoryId: category._id,
                        notes: 'Initial balance at account creation',
                        balanceSnapshot: current.balance + Number(balance),
                    })
                    updateFields.balance = current.balance + Number(balance)
                }
            }

            // If setting this as default, clear default from all other accounts
            if (isDefault === true) {
                await Account.updateMany({ userId, _id: { $ne: req.params.id }, isDeleted: false }, { $set: { isDefault: false } })
            }

            const account = await Account.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true, runValidators: true })
            httpResponse(req, res, 200, 'Account updated successfully', account)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    deleteAccount: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const accountId = req.params.id

            // Identify account
            const account = await Account.findOne({ _id: accountId, userId, isDeleted: false })
            if (!account) return httpError(next, new Error('Account not found'), req, 404)

            // Block CASH account deletion
            if (account.type === 'CASH') {
                return httpError(next, new Error('Cash account cannot be deleted.'), req, 400)
            }

            // Cascading soft-delete related data
            const Transaction = mongoose.model('Transaction')

            // 1. Mark transactions as deleted
            await Transaction.updateMany({ userId, accountId, isDeleted: false }, { $set: { isDeleted: true } })

            // 2. Mark the account itself as deleted
            account.isDeleted = true
            account.isDefault = false
            await account.save()

            httpResponse(req, res, 200, 'Account and all related transactions deleted successfully', account)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getOpeningBalance: async (req, res, next) => {
        try {
            const Transaction = mongoose.model('Transaction')
            const transaction = await Transaction.findOne({
                accountId: req.params.id,
                userId: req.authenticatedUser._id,
                title: 'Opening Balance',
                notes: 'Initial balance at account creation',
            })
            if (!transaction) return httpResponse(req, res, 200, 'No opening balance found', { amount: 0 })
            httpResponse(req, res, 200, 'Opening balance retrieved', { amount: transaction.amount })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}

