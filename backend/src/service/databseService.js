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
    runInTransaction,
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
    findAccountByAccountType: (type, userId) => {
        return accountModel.findOne({ type, userId })
    },
    findAccountByAccountNumber: (accountNumber, userId) => {
        return accountModel.findOne({ accountNumber, userId })
    },
    findTransactionsByAccountId: (accountId, userId) => {
        return transactionModel.find({ 
            userId,
            $or: [{ accountId: accountId }, { targetAccountId: accountId }],
            isDeleted: false 
        })
    },
    updateAccount: async (id, userId, payload) => {
        return accountModel.findOneAndUpdate({ _id: id, userId }, payload, { new: true })
    },
    fiendAccountById: (id, userId) => {
        return accountModel.findOne({ _id: id, userId })
    },
    addAmount: async (id, userId, payload) => {
        return accountModel.findOneAndUpdate({ _id: id, userId }, payload, { new: true })
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

            const categories = await categoryModel.insertMany([
                { userId, name: 'Expense', type: 'EXPENSE' },
                { userId, name: 'Income', type: 'INCOME' },
                { userId, name: 'Transfer', type: 'TRANSFER' },
            ])

            const updatedUser = await userModel.findByIdAndUpdate(
                userId,
                { $set: { setBasicDetails: true } },
                { new: true }
            )

            return { account, categories, user: updatedUser }
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
            const account = await accountModel.findOne({ _id: payload.accountId, userId: payload.userId }).session(session)
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
                pendingStatus: payload.pendingStatus || false,
                debtType: payload.debtType || null,
                dueDate: payload.dueDate || null,
                interestRate: payload.interestRate || 0,
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
                
                const targetAccount = await accountModel.findOne({ _id: payload.targetAccountId, userId: payload.userId }).session(session)
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
                    const party = await partyModel.findOneAndUpdate({ _id: payload.partyId, userId: payload.userId }, { $inc: { netDebt: debtChange } }, { session })
                    if (!party) throw new Error('Party not found or unauthorized')
                }
                
                await account.save({ session })
                updatedAccounts.push(account)
                transaction.balanceSnapshot = account.balance

                // Also create a linked Loan record so it appears on the Personal Debt page
                if (payload.partyId && (payload.debtType === 'LENT' || payload.debtType === 'BORROWED')) {
                    await loanModel.create([{
                        user: payload.userId,
                        party: payload.partyId,
                        accountId: payload.accountId,
                        amount: payload.amount,
                        type: payload.debtType,
                        date: payload.date || new Date(),
                        interestRate: payload.interestRate || 0,
                        dueDate: payload.dueDate || null,
                        status: 'PENDING',
                        transactionId: transaction._id,
                    }], session ? { session } : {})
                }
            } else if (payload.type === 'repayment') {
                const isRepayOut = payload.debtType === 'REPAYMENT_OUT' || payload.debtType === 'REPAY_OUT'
                if (isRepayOut) {
                    if (account.balance < payload.amount) throw new Error('Insufficient balance')
                    account.balance -= payload.amount
                } else {
                    account.balance += payload.amount
                }
                if (payload.partyId) {
                    const isRepayIn = payload.debtType === 'REPAYMENT_IN' || payload.debtType === 'REPAY_IN'
                    const change = isRepayIn ? -payload.amount : payload.amount
                    const party = await partyModel.findOneAndUpdate({ _id: payload.partyId, userId: payload.userId }, { $inc: { netDebt: change } }, { session })
                    if (!party) throw new Error('Party not found or unauthorized')
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
                const acc = await accountModel.findOneAndUpdate({ _id: transaction.accountId, userId }, { $inc: { balance: transaction.amount } }, { new: true, session })
                updatedAccounts.push(acc)
            } else if (transaction.type === 'income') {
                const acc = await accountModel.findOneAndUpdate({ _id: transaction.accountId, userId }, { $inc: { balance: -transaction.amount } }, { new: true, session })
                updatedAccounts.push(acc)
            } else if (transaction.type === 'transfer') {
                const accSource = await accountModel.findOneAndUpdate({ _id: transaction.accountId, userId }, { $inc: { balance: transaction.amount } }, { new: true, session })
                const accTarget = await accountModel.findOneAndUpdate({ _id: transaction.targetAccountId, userId }, { $inc: { balance: -transaction.amount } }, { new: true, session })
                updatedAccounts.push(accSource, accTarget)
            } else if (transaction.type === 'debt') {
                const isLending = transaction.debtType === 'LENT'
                // Reversal: If LENT originally (spent), then ADD back to account.
                // If BORROWED originally (received), then SUBTRACT from account.
                const balanceChange = isLending ? transaction.amount : -transaction.amount
                const acc = await accountModel.findOneAndUpdate({ _id: transaction.accountId, userId }, { $inc: { balance: balanceChange } }, { new: true, session })
                updatedAccounts.push(acc)

                if (transaction.partyId) {
                    // Reversal: Lending increased debt, so decrease it. Borrowing decreased it, so increase it.
                    const debtChange = isLending ? -transaction.amount : transaction.amount
                    await partyModel.findOneAndUpdate({ _id: transaction.partyId, userId }, { $inc: { netDebt: debtChange } }, { session })
                }
            } else if (transaction.type === 'repayment') {
                // Reversal: Repay OUT (spent), add back. Repay IN (received), subtract.
                const isRepayOut = transaction.debtType === 'REPAYMENT_OUT' || transaction.debtType === 'REPAY_OUT'
                const balanceChange = isRepayOut ? transaction.amount : -transaction.amount
                const acc = await accountModel.findOneAndUpdate({ _id: transaction.accountId, userId }, { $inc: { balance: balanceChange } }, { new: true, session })
                updatedAccounts.push(acc)

                if (transaction.partyId) {
                    // Reversal: Repay IN decreased receivable, add it back. Repay OUT decreased payable, add it back.
                    // If Repay IN (LENT direction), change was -amount, so add back +amount.
                    // If Repay OUT (BORROWED direction), change was +amount, so add back -amount.
                    const debtChange = (transaction.debtType === 'REPAYMENT_IN' || transaction.debtType === 'REPAY_IN') ? transaction.amount : -transaction.amount
                    await partyModel.findOneAndUpdate({ _id: transaction.partyId, userId }, { $inc: { netDebt: debtChange } }, { session })
                }
            }

            // Soft Delete
            transaction.isDeleted = true
            await transaction.save({ session })

            // Cascade: If this transaction is linked to a Loan record, soft-delete it too.
            // We look up by transactionId on the Loan model (Loan stores transactionId reference).
            // The isDeleted guard prevents infinite loops when the loan controller initiates the delete.
            if (transaction.type === 'debt' || transaction.type === 'repayment') {
                const linkedLoan = await loanModel.findOne({ transactionId: transaction._id, isDeleted: false }).session(session)
                if (linkedLoan) {
                    linkedLoan.isDeleted = true
                    await linkedLoan.save({ session })
                }
            }

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
                await accountModel.findOneAndUpdate({ _id: oldTransaction.accountId, userId }, { $inc: { balance: oldTransaction.amount } }, { session })
            } else if (oldTransaction.type === 'income') {
                await accountModel.findOneAndUpdate({ _id: oldTransaction.accountId, userId }, { $inc: { balance: -oldTransaction.amount } }, { session })
            } else if (oldTransaction.type === 'transfer') {
                await accountModel.findOneAndUpdate({ _id: oldTransaction.accountId, userId }, { $inc: { balance: oldTransaction.amount } }, { session })
                await accountModel.findOneAndUpdate({ _id: oldTransaction.targetAccountId, userId }, { $inc: { balance: -oldTransaction.amount } }, { session })
            } else if (oldTransaction.type === 'debt') {
                const balanceChange = oldTransaction.debtType === 'LENT' ? oldTransaction.amount : -oldTransaction.amount
                await accountModel.findOneAndUpdate({ _id: oldTransaction.accountId, userId }, { $inc: { balance: balanceChange } }, { session })
                if (oldTransaction.partyId) {
                    const debtChange = oldTransaction.debtType === 'LENT' ? -oldTransaction.amount : oldTransaction.amount
                    await partyModel.findOneAndUpdate({ _id: oldTransaction.partyId, userId }, { $inc: { netDebt: debtChange } }, { session })
                }
            } else if (oldTransaction.type === 'repayment') {
                const isRepayOut = oldTransaction.debtType === 'REPAYMENT_OUT' || oldTransaction.debtType === 'REPAY_OUT'
                const balanceChange = isRepayOut ? oldTransaction.amount : -oldTransaction.amount
                await accountModel.findOneAndUpdate({ _id: oldTransaction.accountId, userId }, { $inc: { balance: balanceChange } }, { session })
                if (oldTransaction.partyId) {
                    const debtChange = (oldTransaction.debtType === 'REPAYMENT_IN' || oldTransaction.debtType === 'REPAY_IN') ? oldTransaction.amount : -oldTransaction.amount
                    await partyModel.findOneAndUpdate({ _id: oldTransaction.partyId, userId }, { $inc: { netDebt: debtChange } }, { session })
                }
            }
            
            // Now apply new logic (similar to create)
            const account = await accountModel.findOne({ _id: payload.accountId, userId: userId }).session(session)
            if (!account) throw new Error('New account not found')

            if (payload.type === 'expense') {
                if (account.balance < payload.amount) throw new Error('Insufficient balance in new account')
                account.balance -= payload.amount
                await account.save({ session })
            } else if (payload.type === 'income') {
                account.balance += payload.amount
                await account.save({ session })
            } else if (payload.type === 'transfer') {
                const targetAccount = await accountModel.findOne({ _id: payload.targetAccountId, userId: userId }).session(session)
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
                    const party = await partyModel.findOneAndUpdate({ _id: payload.partyId, userId: userId }, { $inc: { netDebt: debtChange } }, { session })
                    if (!party) throw new Error('Party not found or unauthorized')
                }
                await account.save({ session })
            } else if (payload.type === 'repayment') {
                const isRepayOut = payload.debtType === 'REPAYMENT_OUT' || payload.debtType === 'REPAY_OUT'
                if (isRepayOut) { account.balance -= payload.amount }
                else { account.balance += payload.amount }
                if (payload.partyId) {
                    const debtChange = (payload.debtType === 'REPAYMENT_IN' || payload.debtType === 'REPAY_IN') ? -payload.amount : payload.amount
                    const party = await partyModel.findOneAndUpdate({ _id: payload.partyId, userId: userId }, { $inc: { netDebt: debtChange } }, { session })
                    if (!party) throw new Error('Party not found or unauthorized')
                }
                await account.save({ session })
            }

            // Update document
            Object.assign(oldTransaction, payload)
            oldTransaction.balanceSnapshot = account.balance
            await oldTransaction.save({ session })

            // Sync linked Loan record for debt transactions
            if (payload.type === 'debt' && payload.partyId && (payload.debtType === 'LENT' || payload.debtType === 'BORROWED')) {
                const existingLoan = await loanModel.findOne({ transactionId: transactionId, isDeleted: false }).session(session)
                if (existingLoan) {
                    existingLoan.amount = payload.amount
                    existingLoan.party = payload.partyId
                    existingLoan.accountId = payload.accountId
                    existingLoan.type = payload.debtType
                    existingLoan.date = payload.date || existingLoan.date
                    existingLoan.interestRate = payload.interestRate ?? existingLoan.interestRate
                    existingLoan.dueDate = payload.dueDate ?? existingLoan.dueDate
                    await existingLoan.save({ session })
                } else {
                    // Create a missing loan record (for old transactions saved before this fix)
                    await loanModel.create([{
                        user: userId,
                        party: payload.partyId,
                        accountId: payload.accountId,
                        amount: payload.amount,
                        type: payload.debtType,
                        date: payload.date || new Date(),
                        interestRate: payload.interestRate || 0,
                        dueDate: payload.dueDate || null,
                        status: 'PENDING',
                        transactionId: transactionId,
                    }], session ? { session } : {})
                }
            }
            
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
        const { userId, accountId, toAccountId, categoryId } = payload
        
        // Verify Account
        const account = await accountModel.findOne({ _id: accountId, userId })
        if (!account) throw new Error('Account not found or unauthorized')

        // Verify Target Account (for transfers)
        if (toAccountId) {
            const toAccount = await accountModel.findOne({ _id: toAccountId, userId })
            if (!toAccount) throw new Error('Target account not found or unauthorized')
        }

        // Verify Category
        if (categoryId) {
            const category = await categoryModel.findOne({ _id: categoryId, userId })
            if (!category) throw new Error('Category not found or unauthorized')
        }

        return recurringModel.create(payload)
    },
    updateRecurringTask: async (id, userId, payload) => {
        const { accountId, toAccountId, categoryId } = payload
        
        // Verify Account
        if (accountId) {
            const account = await accountModel.findOne({ _id: accountId, userId })
            if (!account) throw new Error('New account not found or unauthorized')
        }

        // Verify Target Account
        if (toAccountId) {
            const toAccount = await accountModel.findOne({ _id: toAccountId, userId })
            if (!toAccount) throw new Error('New target account not found or unauthorized')
        }

        // Verify Category
        if (categoryId) {
            const category = await categoryModel.findOne({ _id: categoryId, userId })
            if (!category) throw new Error('New category not found or unauthorized')
        }

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
    },
    countRecurringTasks: async (userId) => {
        return recurringModel.countDocuments({ userId })
    },
    updateUserSubscription: async (userId, planData) => {
        return userModel.findOneAndUpdate(
            { _id: userId },
            { $set: planData },
            { new: true }
        )
    }
}

