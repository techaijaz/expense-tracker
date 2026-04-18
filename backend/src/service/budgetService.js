import budgetModel from '../model/budgetModel.js'
import budgetPeriodModel from '../model/budgetPeriodModel.js'
import transactionModel from '../model/transactionModel.js'
import dayjs from 'dayjs'

export default {
    /**
     * Updates the spent amount for a specific budget period.
     * Called when a transaction is created, updated, or deleted.
     */
    updateBudgetProgress: async (userId, categoryId, date) => {
        const d = dayjs(date)
        const month = d.month() + 1
        const year = d.year()

        const budget = await budgetModel.findOne({ userId, categoryId, isActive: true })
        if (!budget) return

        // 1. Calculate total spent for this category in this month
        const startOfMonth = d.startOf('month').toDate()
        const endOfMonth = d.endOf('month').toDate()

        const totalSpentResult = await transactionModel.aggregate([
            {
                $match: {
                    userId,
                    categoryId,
                    type: 'expense',
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ])

        const totalSpent = totalSpentResult[0]?.total || 0

        // 2. Update or create the budget period
        const period = await budgetPeriodModel.findOneAndUpdate(
            { userId, budgetId: budget._id, month, year },
            { 
                $set: { 
                    spentAmount: totalSpent,
                    allocatedAmount: budget.amount // Sync current budget amount
                } 
            },
            { upsert: true, new: true }
        )

        // 3. Check 80% threshold
        const threshold = budget.amount * 0.8
        if (totalSpent >= threshold && !period.isAlertSent) {
            console.log(`Alert: Budget for category ${categoryId} is at ${Math.round((totalSpent / budget.amount) * 100)}%`)
            period.isAlertSent = true
            await period.save()
        } else if (totalSpent < threshold && period.isAlertSent) {
            period.isAlertSent = false
            await period.save()
        }

        return period
    },

    getBudgetProgress: async (userId) => {
        const now = dayjs()
        const month = now.month() + 1
        const year = now.year()

        const budgets = await budgetModel.find({ userId, isActive: true }).populate('categoryId', 'name icon')
        
        const progress = await Promise.all(budgets.map(async (b) => {
            let period = await budgetPeriodModel.findOne({ userId, budgetId: b._id, month, year })
            
            if (!period) {
                return {
                    category: b.categoryId,
                    budgetAmount: b.amount,
                    spentAmount: 0,
                    remaining: b.amount,
                    percent: 0
                }
            }

            return {
                category: b.categoryId,
                budgetAmount: b.amount,
                spentAmount: period.spentAmount,
                remaining: Math.max(0, b.amount - period.spentAmount),
                percent: Math.min(100, Math.round((period.spentAmount / b.amount) * 100))
            }
        }))

        return progress
    }
}

