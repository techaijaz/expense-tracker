import mongoose from 'mongoose'
import config from '../config/config.js'
import userModel from '../model/userModel.js'
import accountModel from '../model/accountModel.js'
import categoryModel from '../model/categoryModel.js'
import transactionModel from '../model/transactionModel.js'
import partyModel from '../model/partiesModel.js'
import loanModel from '../model/loanModel.js'
import recurringModel from '../model/recurringModel.js'
import budgetService from './budgetService.js'

const runInTransaction = async (work) => {
    const session = await mongoose.startSession()
    try {
        let result
        await session.withTransaction(async () => {
            result = await work(session)
        })
        return result
    } catch (error) {
        if (error.message.includes('Transaction numbers are only allowed on a replica set member or mongos')) {
            console.warn('MongoDB Transactions not supported (standalone). Falling back to non-transactional execution.')
            return await work(null)
        }
        throw error
    } finally {
        session.endSession()
    }
}

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
            { 'refreshToken.token': token },
            { $set: { 'refreshToken.token': null } }
        )
    },
    getRefreshToken: (token) => {
        return userModel.findOne({ 'refreshToken.token': token })
    },
    createAccount: async (payload) => {
        return accountModel.create(payload)
    },
    getAccountsByUserId: (userId) => {
        return accountModel.find({ userId, isDeleted: false }).sort({ isDefault: -1, createdAt: -1 })
    },
    findAccountByAccountType: (type) => {
        return accountModel.findOne({ type })
    },
    findAccountByAccountNumber: (accountNumber) => {
        return accountModel.findOne({ accountNumber })
    },
    findTrasectionsByAccountId: (accountId) => {
        return transactionModel.find({ 
            $or: [{ accountId: accountId }, { targetAccountId: accountId }],
            isDeleted: false 
        })
    },
    updateAccount: async (id, payload) => {
        return accountModel.findByIdAndUpdate(id, payload, { new: true })
    },
    fiendAccountById: (id) => {
        return accountModel.findById(id)
    },
    addAmount: async (id, payload) => {
        return accountModel.findByIdAndUpdate(id, payload, { new: true })
    },
    getAllCategories: (userId) => {
        return categoryModel.find({ userId })
    },
    findCategoryByUserIdAndName: (userId, name) => {
        return categoryModel.findOne({ userId, name })
    },
    createCategory: async (payload) => {
        return categoryModel.create(payload)
    },
    addCatagory: async (payload) => {
        return categoryModel.create(payload)
    },
    setDefaultData: async (userId) => {
        try {
            const account = await accountModel.create({
                userId: userId,
                name: 'Cash',
                type: 'CASH',
                balance: 0.0,
                isActive: true,
                isDefault: true,
                isCash: true,
            })

            const category = await categoryModel.create({
                userId: userId,
                name: 'Expense',
                type: 'EXPENSE',
            })

            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                { $set: { setBasicDetails: true } },
                { new: true }
            )

            return { account, category, user: updatedUser }
        } catch (error) {
            console.error('Default data creation failed:', error.message)
            throw error
        }
    },
    getAllTransections: async (userId, filters) => {
        try {
            const andConditions = [{ userId, isDeleted: false }]

            // 1. Account Filtering
            if (filters.accountId && filters.accountId !== 'all') {
                if (mongoose.Types.ObjectId.isValid(filters.accountId)) {
                    const accId = new mongoose.Types.ObjectId(filters.accountId)
                    andConditions.push({ $or: [{ accountId: accId }, { targetAccountId: accId }] })
                }
            }

            // 2. Category Filtering
            if (filters.categoryId && filters.categoryId !== 'all') {
                if (mongoose.Types.ObjectId.isValid(filters.categoryId)) {
                    andConditions.push({ categoryId: new mongoose.Types.ObjectId(filters.categoryId) })
                }
            }

            // 3. Party Filtering
            if (filters.partyId && filters.partyId !== 'all') {
                if (mongoose.Types.ObjectId.isValid(filters.partyId)) {
                    andConditions.push({ partyId: new mongoose.Types.ObjectId(filters.partyId) })
                }
            }

            // 4. Type Filtering
            if (filters.type && filters.type !== 'all') {
                andConditions.push({ type: filters.type.toLowerCase() })
            }

            // 5. Search Filtering
            if (filters.search) {
                const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const searchRegex = { $regex: escapedSearch, $options: 'i' }
                andConditions.push({
                    $or: [
                        { title: searchRegex },
                        { notes: searchRegex },
                        { tags: searchRegex },
                    ],
                })
            }

            // 6. Date Range Filtering
            if (filters.dateRange?.from || filters.dateRange?.to) {
                const dateFilter = {}
                if (filters.dateRange.from) dateFilter.$gte = new Date(filters.dateRange.from)
                if (filters.dateRange.to) dateFilter.$lte = new Date(filters.dateRange.to)
                if (Object.keys(dateFilter).length > 0) {
                    andConditions.push({ date: dateFilter })
                }
            }

            const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0]

            // 3. Pagination & Execution
            const limit = Math.max(1, Math.min(parseInt(filters.pagination?.limit) || 10, 50))
            const page = Math.max(1, parseInt(filters.pagination?.page) || 1)
            const skip = (page - 1) * limit

            const totalCount = await transactionModel.countDocuments(query)

            const transactions = await transactionModel
                .find(query)
                .populate('categoryId', 'name icon type')
                .populate('accountId', 'name balance type')
                .populate('targetAccountId', 'name balance type')
                .populate('partyId', 'name relation')
                .sort({ date: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()

            // 4. Map for Frontend Consistency
            const formattedTransactions = transactions.map((t) => {
                let displayType = t.type
                let displayAmount = t.amount

                // Handle Contextual Display for Transfers
                if (t.type === 'transfer' && filters.accountId && filters.accountId !== 'all') {
                    if (t.accountId.toString() === filters.accountId) {
                        displayType = 'transfer_out'
                        displayAmount = -t.amount
                    } else if (t.targetAccountId?.toString() === filters.accountId) {
                        displayType = 'transfer_in'
                        displayAmount = t.amount
                    }
                } else if (t.type === 'expense' || (t.type === 'debt' && t.partyId)) {
                   // Logic for debt depends on LENT/BORROWED, usually expense is negative
                   // For now, let's keep it simple as the UI expects.
                }

                return {
                    ...t,
                    displayType,
                    displayAmount,
                }
            })

            return { transactions: formattedTransactions, totalCount }
        } catch (error) {
            console.error('Database Error:', error)
            throw new Error('Database query failed')
        }
    },
    createTransaction: async (payload) => {
        return await runInTransaction(async (session) => {
            // 1. Fetch Primary Account
            const account = await accountModel.findById(payload.accountId).session(session)
            if (!account) throw new Error('Account not found')

            // 2. Prepare Transaction
            const transaction = new transactionModel({
                userId: payload.userId,
                accountId: payload.accountId,
                targetAccountId: payload.targetAccountId || null,
                type: payload.type,
                amount: payload.amount,
                title: payload.title,
                date: payload.date || new Date(),
                categoryId: payload.categoryId || null,
                partyId: payload.partyId || null,
                notes: payload.notes || '',
                tags: payload.tags || [],
                billUrl: payload.billUrl || '',
                loanId: payload.loanId || null,
                recurringId: payload.recurringId || null,
            })

            // 3. Update Balances based on Type
            const updatedAccounts = []
            if (payload.type === 'expense') {
                if (account.balance < payload.amount) throw new Error('Insufficient balance')
                account.balance -= payload.amount
                await account.save({ session })
                updatedAccounts.push(account)
                transaction.balanceSnapshot = account.balance
            } else if (payload.type === 'income') {
                account.balance += payload.amount
                await account.save({ session })
                updatedAccounts.push(account)
                transaction.balanceSnapshot = account.balance
            } else if (payload.type === 'transfer') {
                if (!payload.targetAccountId) throw new Error('Target account required for transfer')
                if (account.balance < payload.amount) throw new Error('Insufficient balance')
                
                const targetAccount = await accountModel.findById(payload.targetAccountId).session(session)
                if (!targetAccount) throw new Error('Target account not found')

                account.balance -= payload.amount
                targetAccount.balance += payload.amount

                await account.save({ session })
                await targetAccount.save({ session })

                updatedAccounts.push(account, targetAccount)
                transaction.balanceSnapshot = account.balance
                transaction.targetBalanceSnapshot = targetAccount.balance
            } else if (payload.type === 'debt') {
                // For debt, we need to know if it's LENT or BORROWED. 
                // We'll infer from context or payload. Usually Debt Given = Expense, Debt Taken = Income.
                // Assuming payload.debtType exists or inferring from a field.
                // For now, let's use a simple debt record that updates balance.
                const isLending = payload.debtType === 'LENT' 
                if (isLending) {
                    if (account.balance < payload.amount) throw new Error('Insufficient balance')
                    account.balance -= payload.amount
                } else {
                    account.balance += payload.amount
                }
                
                if (payload.partyId) {
                    const debtChange = isLending ? payload.amount : -payload.amount
                    await partyModel.findByIdAndUpdate(payload.partyId, { $inc: { netDebt: debtChange } }, { session })
                }
                
                await account.save({ session })
                updatedAccounts.push(account)
                transaction.balanceSnapshot = account.balance
            } else if (payload.type === 'repayment') {
                if (payload.debtType === 'REPAY_OUT') {
                    if (account.balance < payload.amount) throw new Error('Insufficient balance')
                    account.balance -= payload.amount
                } else {
                    account.balance += payload.amount
                }
                if (payload.partyId) {
                    const change = payload.debtType === 'REPAY_IN' ? -payload.amount : payload.amount
                    await partyModel.findByIdAndUpdate(payload.partyId, { $inc: { netDebt: change } }, { session })
                }
                await account.save({ session })
                updatedAccounts.push(account)
                transaction.balanceSnapshot = account.balance
            }

            await transaction.save({ session })


            // 4. Update Budget Progress
            if (payload.categoryId && payload.type === 'expense') {
                await budgetService.updateBudgetProgress(payload.userId, payload.categoryId, payload.date || new Date())
            }

            return { transaction, updatedAccounts }
        })
    },
    deleteTransaction: async (transactionId, userId) => {
        return await runInTransaction(async (session) => {
            const transaction = await transactionModel.findOne({ _id: transactionId, userId }).session(session)
            if (!transaction || transaction.isDeleted) throw new Error('Transaction not found')

            // Reverse Balances
            const updatedAccounts = []
            if (transaction.type === 'expense') {
                const acc = await accountModel.findByIdAndUpdate(transaction.accountId, { $inc: { balance: transaction.amount } }, { new: true, session })
                updatedAccounts.push(acc)
            } else if (transaction.type === 'income') {
                const acc = await accountModel.findByIdAndUpdate(transaction.accountId, { $inc: { balance: -transaction.amount } }, { new: true, session })
                updatedAccounts.push(acc)
            } else if (transaction.type === 'transfer') {
                const accSource = await accountModel.findByIdAndUpdate(transaction.accountId, { $inc: { balance: transaction.amount } }, { new: true, session })
                const accTarget = await accountModel.findByIdAndUpdate(transaction.targetAccountId, { $inc: { balance: -transaction.amount } }, { new: true, session })
                updatedAccounts.push(accSource, accTarget)
            } else if (transaction.type === 'debt') {
                const isLending = transaction.debtType === 'LENT'
                // Reversal: If LENT originally (spent), then ADD back to account.
                // If BORROWED originally (received), then SUBTRACT from account.
                const balanceChange = isLending ? transaction.amount : -transaction.amount
                const acc = await accountModel.findByIdAndUpdate(transaction.accountId, { $inc: { balance: balanceChange } }, { new: true, session })
                updatedAccounts.push(acc)

                if (transaction.partyId) {
                    // Reversal: Lending increased debt, so decrease it. Borrowing decreased it, so increase it.
                    const debtChange = isLending ? -transaction.amount : transaction.amount
                    await partyModel.findByIdAndUpdate(transaction.partyId, { $inc: { netDebt: debtChange } }, { session })
                }
            } else if (transaction.type === 'repayment') {
                // Reversal: Repay OUT (spent), add back. Repay IN (received), subtract.
                const isRepayOut = transaction.debtType === 'REPAYMENT_OUT' || transaction.debtType === 'REPAY_OUT'
                const balanceChange = isRepayOut ? transaction.amount : -transaction.amount
                const acc = await accountModel.findByIdAndUpdate(transaction.accountId, { $inc: { balance: balanceChange } }, { new: true, session })
                updatedAccounts.push(acc)

                if (transaction.partyId) {
                    // Reversal: Repay IN decreased receivable, add it back. Repay OUT decreased payable, add it back.
                    // If Repay IN (LENT direction), change was -amount, so add back +amount.
                    // If Repay OUT (BORROWED direction), change was +amount, so add back -amount.
                    const debtChange = (transaction.debtType === 'REPAYMENT_IN' || transaction.debtType === 'REPAY_IN') ? transaction.amount : -transaction.amount
                    await partyModel.findByIdAndUpdate(transaction.partyId, { $inc: { netDebt: debtChange } }, { session })
                }
            }

            // Soft Delete
            transaction.isDeleted = true
            await transaction.save({ session })

            // Update Budget
            if (transaction.categoryId && transaction.type === 'expense') {
                await budgetService.updateBudgetProgress(userId, transaction.categoryId, transaction.date)
            }

            return { success: true, updatedAccounts }
        })
    },
    editTransaction: async (transactionId, userId, payload) => {
        return await runInTransaction(async (session) => {
            // First undo the current transaction
            const oldTransaction = await transactionModel.findOne({ _id: transactionId, userId }).session(session)
            if (!oldTransaction || oldTransaction.isDeleted) throw new Error('Transaction not found')

            // Revert balances
            if (oldTransaction.type === 'expense') {
                await accountModel.findByIdAndUpdate(oldTransaction.accountId, { $inc: { balance: oldTransaction.amount } }, { session })
            } else if (oldTransaction.type === 'income') {
                await accountModel.findByIdAndUpdate(oldTransaction.accountId, { $inc: { balance: -oldTransaction.amount } }, { session })
            } else if (oldTransaction.type === 'transfer') {
                await accountModel.findByIdAndUpdate(oldTransaction.accountId, { $inc: { balance: oldTransaction.amount } }, { session })
                await accountModel.findByIdAndUpdate(oldTransaction.targetAccountId, { $inc: { balance: -oldTransaction.amount } }, { session })
            } else if (oldTransaction.type === 'debt') {
                const balanceChange = oldTransaction.debtType === 'LENT' ? oldTransaction.amount : -oldTransaction.amount
                await accountModel.findByIdAndUpdate(oldTransaction.accountId, { $inc: { balance: balanceChange } }, { session })
                if (oldTransaction.partyId) {
                    const debtChange = oldTransaction.debtType === 'LENT' ? -oldTransaction.amount : oldTransaction.amount
                    await partyModel.findByIdAndUpdate(oldTransaction.partyId, { $inc: { netDebt: debtChange } }, { session })
                }
            } else if (oldTransaction.type === 'repayment') {
                const isRepayOut = oldTransaction.debtType === 'REPAYMENT_OUT' || oldTransaction.debtType === 'REPAY_OUT'
                const balanceChange = isRepayOut ? oldTransaction.amount : -oldTransaction.amount
                await accountModel.findByIdAndUpdate(oldTransaction.accountId, { $inc: { balance: balanceChange } }, { session })
                if (oldTransaction.partyId) {
                    const debtChange = (oldTransaction.debtType === 'REPAYMENT_IN' || oldTransaction.debtType === 'REPAY_IN') ? oldTransaction.amount : -oldTransaction.amount
                    await partyModel.findByIdAndUpdate(oldTransaction.partyId, { $inc: { netDebt: debtChange } }, { session })
                }
            }
            
            // Now apply new logic (similar to create)
            const account = await accountModel.findById(payload.accountId).session(session)
            if (!account) throw new Error('New account not found')

            if (payload.type === 'expense') {
                if (account.balance < payload.amount) throw new Error('Insufficient balance in new account')
                account.balance -= payload.amount
                await account.save({ session })
            } else if (payload.type === 'income') {
                account.balance += payload.amount
                await account.save({ session })
            } else if (payload.type === 'transfer') {
                const targetAccount = await accountModel.findById(payload.targetAccountId).session(session)
                if (!targetAccount) throw new Error('New target account not found')
                account.balance -= payload.amount
                targetAccount.balance += payload.amount
                await account.save({ session })
                await targetAccount.save({ session })
            } else if (payload.type === 'debt') {
                const isLending = payload.debtType === 'LENT' 
                if (isLending) { account.balance -= payload.amount }
                else { account.balance += payload.amount }
                if (payload.partyId) {
                    const debtChange = isLending ? payload.amount : -payload.amount
                    await partyModel.findByIdAndUpdate(payload.partyId, { $inc: { netDebt: debtChange } }, { session })
                }
                await account.save({ session })
            } else if (payload.type === 'repayment') {
                const isRepayOut = payload.debtType === 'REPAYMENT_OUT' || payload.debtType === 'REPAY_OUT'
                if (isRepayOut) { account.balance -= payload.amount }
                else { account.balance += payload.amount }
                if (payload.partyId) {
                    const debtChange = (payload.debtType === 'REPAYMENT_IN' || payload.debtType === 'REPAY_IN') ? -payload.amount : payload.amount
                    await partyModel.findByIdAndUpdate(payload.partyId, { $inc: { netDebt: debtChange } }, { session })
                }
                await account.save({ session })
            }

            // Update document
            Object.assign(oldTransaction, payload)
            oldTransaction.balanceSnapshot = account.balance
            await oldTransaction.save({ session })
            
            // Update Budget Progress
            if (payload.categoryId && payload.type === 'expense') {
                await budgetService.updateBudgetProgress(userId, payload.categoryId, payload.date || new Date())
            }

            return { transaction: oldTransaction }
        })
    },
    getTotalBalance: async (userId) => {
        return accountModel.aggregate([{ $match: { userId } }, { $group: { _id: null, totalBalance: { $sum: '$balance' } } }])
    },
    getTotalIncome: async (userId) => {
        return transactionModel.aggregate([
            { $match: { userId, type: 'income', isDeleted: false } },
            { $group: { _id: null, totalIncome: { $sum: '$amount' } } }
        ])
    },
    getTotalExpense: async (userId) => {
        return transactionModel.aggregate([
            { $match: { userId, type: 'expense', isDeleted: false } },
            { $group: { _id: null, totalExpense: { $sum: '$amount' } } },
        ])
    },
    getPopulatedTransaction: async (transactionId, userId) => {
        return transactionModel
            .findOne({ _id: transactionId, userId, isDeleted: false })
            .populate('categoryId', 'name icon type')
            .populate('accountId', 'name balance type')
            .populate('targetAccountId', 'name balance type')
            .populate('partyId', 'name relation')
            .lean()
    },
    // Recurring Task Methods
    getAllRecurringTasks: async (userId) => {
        return recurringModel.find({ userId })
            .populate('categoryId', 'name icon')
            .populate('accountId', 'name type balance')
            .sort({ createdAt: -1 })
    },
    createRecurringTask: async (payload) => {
        return recurringModel.create(payload)
    },
    updateRecurringTask: async (id, userId, payload) => {
        return recurringModel.findOneAndUpdate({ _id: id, userId }, payload, { new: true })
    },
    deleteRecurringTask: async (id, userId) => {
        return recurringModel.findOneAndDelete({ _id: id, userId })
    },
    findRecurringById: async (id, userId) => {
        return recurringModel.findOne({ _id: id, userId })
    },
    getTransactionsByRecurringId: async (recurringId, userId) => {
        return transactionModel.find({ recurringId, userId, isDeleted: false })
            .populate('categoryId', 'name icon')
            .populate('accountId', 'name')
            .sort({ date: -1 })
    }
}

