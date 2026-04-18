import creditCardCycleModel from '../model/creditCardCycleModel.js'
import transactionModel from '../model/transactionModel.js'
import dayjs from 'dayjs'

export default {
    predictUpcomingBill: async (userId, accountId) => {
        const cycle = await creditCardCycleModel.findOne({ userId, accountId })
        if (!cycle) return null

        const now = dayjs()
        let lastStatementDate
        
        if (now.date() >= cycle.statementDay) {
            lastStatementDate = now.date(cycle.statementDay).startOf('day')
        } else {
            lastStatementDate = now.subtract(1, 'month').date(cycle.statementDay).startOf('day')
        }

        const nextStatementDate = lastStatementDate.add(1, 'month')
        const dueDate = lastStatementDate.add(1, 'month').date(cycle.dueDay)

        // Calculate unbilled transactions (from last statement date to now)
        const unbilledResult = await transactionModel.aggregate([
            {
                $match: {
                    userId,
                    accountId,
                    type: 'expense',
                    date: { $gte: lastStatementDate.toDate() },
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

        const unbilledAmount = unbilledResult[0]?.total || 0

        return {
            accountId,
            lastStatementDate: lastStatementDate.toDate(),
            nextStatementDate: nextStatementDate.toDate(),
            dueDate: dueDate.toDate(),
            currentUnbilledAmount: unbilledAmount,
            estimatedTotalBill: unbilledAmount + (cycle.lastStatementBalance || 0)
        }
    }
}

