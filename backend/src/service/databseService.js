import mongoose from 'mongoose'
import config from '../config/config.js'
import userModel from '../model/userModel.js'
import accountModel from '../model/accountModel.js'
import categoryModel from '../model/categoryModel.js'
import transactionModel from '../model/transectionModel.js'

export default {
    connect: async () => {
        try {
            await mongoose.connect(config.DATABASE_URL)
            return mongoose.connection
        } catch (error) {
            return error
        }
    },
    findUserByEmail: (email, select = '') => {
        return userModel.findOne({ email }).select(select)
    },
    findUserById: (id, select = '') => {
        return userModel.findById(id).select(select)
    },
    registerUser: (user) => {
        return userModel.create(user)
    },
    findUserByConfirmationTokenAndCode: (token, code) => {
        return userModel.findOne({
            'accountConfirmation.token': token,
            'accountConfirmation.code': code,
        })
    },
    findUserByPasswordResetToken: (token) => {
        return userModel.findOne({
            'passwordReset.token': token,
        })
    },
    deleteRefreshToken: (token) => {
        return userModel.findOneAndUpdate(
            { 'refreshToken.token': token }, // Find user with the given refresh token
            { $set: { 'refreshToken.token': null } } // Set the token field to null
        )
    },
    getRefreshTokan: (token) => {
        return userModel.findOne(
            { 'refreshToken.token': token } // Find user with the given refresh token
        )
    },
    createAccount: async (payload) => {
        return accountModel.create(payload)
    },
    getAccountsByUserId: (userId) => {
        return accountModel.find({ user: userId }).select('name accountNumber type balance isDefault status') // Find accounts associated with the given user ID
    },
    findAccountByAccountType: (type) => {
        return accountModel.findOne({ type }) // Find account with the given type
    },
    findAccountByAccountNumber: (accountNumber) => {
        return accountModel.findOne({ accountNumber }) // Find account with the given account number
    },
    findTrasectionsByAccountId: (accountId) => {
        return transactionModel.find({ account: accountId })
    },
    updateAccount: async (id, payload) => {
        return accountModel.findByIdAndUpdate(id, payload, { new: true }) // Find and update account with the given ID
    },
    fiendAccountById: (id) => {
        return accountModel.findById(id)
    },
    addAmount: async (id, payload) => {
        return accountModel.findByIdAndUpdate(id, payload, { new: true }) // Find and update account with the given ID
    },
    getAllCategories: (userId) => {
        return categoryModel.find({ user: userId })
    },
    findCategoryByUserIdAndName: (userId, name) => {
        return categoryModel.findOne({ user: userId, name }) // Find category with the given user ID and name
    },
    createCategory: async (payload) => {
        return categoryModel.create(payload)
    },
    addCatagory: async (payload) => {
        return categoryModel.create(payload)
    },
    setDefaultData: async (userId) => {
        try {
            // 1. Create default account
            const account = await accountModel.create({
                user: userId,
                name: 'Cash',
                accountNumber: '',
                type: 'Cash',
                balance: 0.0, // Use number instead of string
                status: true,
                isDefault: true,
            })

            // 2. Create default category
            const category = await categoryModel.create({
                user: userId,
                name: 'Expense',
            })

            // 3. Update user flag
            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                { $set: { setBasicDetails: true } },
                { new: true } // Return updated document
            )

            return { account, category, user: updatedUser }
        } catch (error) {
            console.error('Default data creation failed:', error.message)
            throw error // Propagate the error for handling upstream
        }
    },
    getAllTransections: async (userId, filters) => {
        try {
            const query = { user: userId }

            // Date range filter
            if (filters.dateRange?.from || filters.dateRange?.to) {
                query.date = {}
                if (filters.dateRange.from) query.date.$gte = new Date(filters.dateRange.from)
                if (filters.dateRange.to) query.date.$lte = new Date(filters.dateRange.to)
            }

            // Amount range filter
            if (filters.amountRange?.min || filters.amountRange?.max) {
                query.amount = {}
                if (filters.amountRange.min) query.amount.$gte = parseFloat(filters.amountRange.min)
                if (filters.amountRange.max) query.amount.$lte = parseFloat(filters.amountRange.max)
            }

            // Exact match filters
            if (filters.category) query.category = filters.category
            if (filters.account) query.account = filters.account
            if (filters.type) query.type = filters.type

            // Text search (case-insensitive)
            if (filters.search) {
                query.$or = [{ description: { $regex: filters.search, $options: 'i' } }, { notes: { $regex: filters.search, $options: 'i' } }]
            }

            // Validate pagination values
            const limit = Math.max(1, Math.min(parseInt(filters.pagination?.limit) || 10, 50)) // Limit max 50
            const page = Math.max(1, parseInt(filters.pagination?.page) || 1)
            const skip = (page - 1) * limit

            // Get total count first
            const totalCount = await transactionModel.countDocuments(query)

            // Ensure 'skip' does not exceed totalCount (preventing out-of-range errors)
            const safeSkip = Math.min(skip, Math.max(0, totalCount - limit))

            console.log(`Pagination - Page: ${page}, Limit: ${limit}, Skip: ${safeSkip}, Total: ${totalCount}`)

            // Fetch transactions (limit large text fields)
            const transactions = await transactionModel
                .find(query, null, { skip: safeSkip, limit })
                .select('date amount category account description type')
                .populate('category', 'name')
                .populate('account', 'name balance')
                .sort({ date: -1, _id: -1 })
                .lean() // ✅ Use `.lean()` to reduce BSON serialization overhead

            return { transactions, totalCount }
        } catch (error) {
            console.error('Database Error:', error)
            throw new Error('Database query failed')
        }
    },
    createTransection: async (payload) => {
        //update account
        if (payload.type === 'expense') {
            const account = await accountModel.findById(payload.account)
            if (account) {
                account.balance -= payload.amount
                await account.save()
            }
        } else if (payload.type === 'income') {
            const account = await accountModel.findById(payload.account)
            if (account) {
                account.balance += payload.amount
                await account.save()
            }
        }

        const result = await transactionModel.create(payload)
        return await transactionModel.findById(result._id).populate('category', 'name').populate('account', 'name balance').lean()
    },
    getTotalBalance: async (userId) => {
        return accountModel.aggregate([{ $match: { user: userId } }, { $group: { _id: null, totalBalance: { $sum: '$balance' } } }])
    },
    getTotalIncome: async (userId) => {
        return transactionModel.aggregate([{ $match: { user: userId, type: 'income' } }, { $group: { _id: null, totalIncome: { $sum: '$amount' } } }])
    },
    getTotalExpense: async (userId) => {
        return transactionModel.aggregate([
            { $match: { user: userId, type: 'expense' } },
            { $group: { _id: null, totalExpense: { $sum: '$amount' } } },
        ])
    },
}
