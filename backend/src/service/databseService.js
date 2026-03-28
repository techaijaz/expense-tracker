import mongoose from 'mongoose'
import config from '../config/config.js'
import userModel from '../model/userModel.js'
import accountModel from '../model/accountModel.js'
import categoryModel from '../model/categoryModel.js'
import transactionModel from '../model/transactionModel.js'
import ledgerModel from '../model/ledgerModel.js'

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
    createTransaction: async (payload) => {
        const session = await mongoose.startSession()
        let result = {}

        try {
            await session.withTransaction(async () => {
                // Step 1: Validate Account & Balance
                const account = await accountModel.findById(payload.accountId).session(session)
                if (!account) {
                    throw new Error('Account not found')
                }

                const isExpense = payload.type === 'expense' || payload.type === 'DEBIT'
                if (isExpense && account.balance < payload.amount) {
                    throw new Error('Insufficient balance')
                }

                // Determine ledger type and double entry flag
                let ledgerType = 'NORMAL'
                let isDoubleEntry = false
                if (payload.ledgerType && payload.ledgerType !== 'NORMAL') {
                    ledgerType = payload.ledgerType
                    isDoubleEntry = true
                } else if (payload.type === 'transfer') {
                    ledgerType = 'TRANSFER'
                    isDoubleEntry = true
                }

                const transType = isExpense ? 'DEBIT' : 'CREDIT'

                // Step 2: Create Ledger
                const ledger = new ledgerModel({
                    userId: payload.userId,
                    title: payload.title,
                    totalAmount: payload.amount,
                    date: payload.date || new Date(),
                    categoryId: payload.categoryId,
                    partyId: payload.partyId || null,
                    ledgerType: ledgerType,
                    isDoubleEntry: isDoubleEntry,
                    billUrl: payload.billUrl || '',
                })
                await ledger.save({ session })

                // Step 3: Transactions
                const transactions = []

                // Single-Entry Transaction
                const t1 = new transactionModel({
                    ledgerId: ledger._id,
                    userId: payload.userId,
                    accountId: payload.accountId,
                    type: transType,
                    amount: payload.amount,
                    note: payload.note || payload.title,
                })
                await t1.save({ session })
                transactions.push(t1)

                // Double-Entry Transaction
                if (isDoubleEntry && payload.toAccountId) {
                    const t2 = new transactionModel({
                        ledgerId: ledger._id,
                        userId: payload.userId,
                        accountId: payload.toAccountId,
                        type: transType === 'DEBIT' ? 'CREDIT' : 'DEBIT',
                        amount: payload.amount,
                        note: payload.note || payload.title,
                    })
                    await t2.save({ session })
                    transactions.push(t2)

                    // Update second account balance using $inc
                    const balanceChange2 = t2.type === 'CREDIT' ? payload.amount : -payload.amount
                    await accountModel.findByIdAndUpdate(payload.toAccountId, { $inc: { balance: balanceChange2 } }, { session })
                }

                // Step 4: Account Update using $inc
                const balanceChange = transType === 'CREDIT' ? payload.amount : -payload.amount
                const updatedAccount = await accountModel.findByIdAndUpdate(
                    payload.accountId,
                    { $inc: { balance: balanceChange } },
                    { new: true, session }
                )

                // Snapshot balance
                t1.balanceSnapshot = updatedAccount.balance
                await t1.save({ session })

                // Step 5: Party Update based on partyId
                if (payload.partyId) {
                    const debtChange = transType === 'DEBIT' ? payload.amount : -payload.amount
                    await mongoose.model('Party').findByIdAndUpdate(payload.partyId, { $inc: { netDebt: debtChange } }, { session })
                }

                result = { ledger, transactions }
            })
        } finally {
            await session.endSession()
        }

        return result
    },
    deleteTransaction: async (ledgerId, userId) => {
        const session = await mongoose.startSession()
        let success = false
        try {
            await session.withTransaction(async () => {
                const ledger = await ledgerModel.findOne({ _id: ledgerId, userId }).session(session)
                if (!ledger || ledger.isDeleted) throw new Error('Ledger not found or already deleted')

                const transactions = await transactionModel.find({ ledgerId }).session(session)

                // Reverse Account Balances
                for (const t of transactions) {
                    const reverseBalanceChange = t.type === 'CREDIT' ? -t.amount : t.amount // Reverse
                    await accountModel.findByIdAndUpdate(t.accountId, { $inc: { balance: reverseBalanceChange } }, { session })
                }

                // Reverse Party Debt
                if (ledger.partyId) {
                    const primaryT = transactions[0]
                    if (primaryT) {
                        const reverseDebtChange = primaryT.type === 'DEBIT' ? -primaryT.amount : primaryT.amount
                        await mongoose.model('Party').findByIdAndUpdate(ledger.partyId, { $inc: { netDebt: reverseDebtChange } }, { session })
                    }
                }

                // Soft Delete
                ledger.isDeleted = true
                await ledger.save({ session })
                await transactionModel.updateMany({ ledgerId }, { $set: { isDeleted: true } }, { session })

                success = true
            })
        } finally {
            await session.endSession()
        }
        return success
    },
    editTransaction: async (ledgerId, userId, payload) => {
        const session = await mongoose.startSession()
        let result = {}
        try {
            await session.withTransaction(async () => {
                const ledger = await ledgerModel.findOne({ _id: ledgerId, userId }).session(session)
                if (!ledger || ledger.isDeleted) throw new Error('Ledger not found or deleted')

                const oldTransactions = await transactionModel.find({ ledgerId }).session(session)

                // 1. REVERSE OLD BALANCES
                for (const t of oldTransactions) {
                    const reverseBalanceChange = t.type === 'CREDIT' ? -t.amount : t.amount
                    await accountModel.findByIdAndUpdate(t.accountId, { $inc: { balance: reverseBalanceChange } }, { session })
                }

                // Reverse Old Party Debt
                if (ledger.partyId) {
                    const primaryT = oldTransactions[0]
                    if (primaryT) {
                        const reverseDebtChange = primaryT.type === 'DEBIT' ? -primaryT.amount : primaryT.amount
                        await mongoose.model('Party').findByIdAndUpdate(ledger.partyId, { $inc: { netDebt: reverseDebtChange } }, { session })
                    }
                }

                // Hard delete old transactions (we will recreate them to keep it clean)
                // Or we could soft delete them and create new ones. Since it's an edit, deleting and recreating is safer.
                await transactionModel.deleteMany({ ledgerId }).session(session)

                // 2. VALIDATE NEW ACCOUNT BALANCES
                const account = await accountModel.findById(payload.accountId).session(session)
                if (!account) throw new Error('New Account not found')

                const isExpense = payload.type === 'expense' || payload.type === 'DEBIT'
                if (isExpense && account.balance < payload.amount) {
                    throw new Error('Insufficient balance in new account')
                }

                let ledgerType = 'NORMAL'
                let isDoubleEntry = false
                if (payload.ledgerType && payload.ledgerType !== 'NORMAL') {
                    ledgerType = payload.ledgerType
                    isDoubleEntry = true
                } else if (payload.type === 'transfer') {
                    ledgerType = 'TRANSFER'
                    isDoubleEntry = true
                }

                const transType = isExpense ? 'DEBIT' : 'CREDIT'

                // 3. UPDATE LEDGER
                ledger.title = payload.title
                ledger.totalAmount = payload.amount
                ledger.date = payload.date || new Date()
                ledger.categoryId = payload.categoryId
                ledger.partyId = payload.partyId || null
                ledger.ledgerType = ledgerType
                ledger.isDoubleEntry = isDoubleEntry
                if (payload.billUrl) ledger.billUrl = payload.billUrl
                await ledger.save({ session })

                // 4. CREATE NEW TRANSACTIONS
                const newTransactions = []

                const t1 = new transactionModel({
                    ledgerId: ledger._id,
                    userId: payload.userId,
                    accountId: payload.accountId,
                    type: transType,
                    amount: payload.amount,
                    note: payload.note || payload.title,
                })
                await t1.save({ session })
                newTransactions.push(t1)

                if (isDoubleEntry && payload.toAccountId) {
                    const t2 = new transactionModel({
                        ledgerId: ledger._id,
                        userId: payload.userId,
                        accountId: payload.toAccountId,
                        type: transType === 'DEBIT' ? 'CREDIT' : 'DEBIT',
                        amount: payload.amount,
                        note: payload.note || payload.title,
                    })
                    await t2.save({ session })
                    newTransactions.push(t2)

                    const balanceChange2 = t2.type === 'CREDIT' ? payload.amount : -payload.amount
                    await accountModel.findByIdAndUpdate(payload.toAccountId, { $inc: { balance: balanceChange2 } }, { session })
                }

                // 5. APPLY NEW ACCOUNT BALANCE
                const balanceChange = transType === 'CREDIT' ? payload.amount : -payload.amount
                const updatedAccount = await accountModel.findByIdAndUpdate(
                    payload.accountId,
                    { $inc: { balance: balanceChange } },
                    { new: true, session }
                )

                t1.balanceSnapshot = updatedAccount.balance
                await t1.save({ session })

                // 6. APPLY NEW PARTY DEBT
                if (payload.partyId) {
                    const debtChange = transType === 'DEBIT' ? payload.amount : -payload.amount
                    await mongoose.model('Party').findByIdAndUpdate(payload.partyId, { $inc: { netDebt: debtChange } }, { session })
                }

                result = { ledger, transactions: newTransactions }
            })
        } finally {
            await session.endSession()
        }
        return result
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
