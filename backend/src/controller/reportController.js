import mongoose from 'mongoose'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Ledger from '../model/ledgerModel.js'
import Account from '../model/accountModel.js'
import Transaction from '../model/transactionModel.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export default {
    getOverview: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const timezone = req.query.timezone || 'Asia/Kolkata' // Defaulting to IST

            let currentMonthStart, currentMonthEnd, prevMonthStart, prevMonthEnd

            if (req.query.startDate && req.query.endDate) {
                currentMonthStart = dayjs(req.query.startDate).tz(timezone).startOf('day').toDate()
                currentMonthEnd = dayjs(req.query.endDate).tz(timezone).endOf('day').toDate()

                // For custom ranges, compute the "previous" period of exactly the same length
                const durationDays = dayjs(currentMonthEnd).diff(dayjs(currentMonthStart), 'day')
                prevMonthEnd = dayjs(currentMonthStart).subtract(1, 'millisecond').toDate()
                prevMonthStart = dayjs(prevMonthEnd).subtract(durationDays, 'day').startOf('day').toDate()
            } else {
                const now = dayjs().tz(timezone)
                currentMonthStart = now.startOf('month').toDate()
                currentMonthEnd = now.endOf('month').toDate()
                prevMonthStart = now.subtract(1, 'month').startOf('month').toDate()
                prevMonthEnd = now.subtract(1, 'month').endOf('month').toDate()
            }

            const calculateTotals = async (start, end) => {
                const result = await Ledger.aggregate([
                    {
                        $match: {
                            userId: new mongoose.Types.ObjectId(userId),
                            isDeleted: false,
                            ledgerType: 'NORMAL',
                            date: { $gte: start, $lte: end },
                        },
                    },
                    {
                        $lookup: {
                            from: 'transactions',
                            localField: '_id',
                            foreignField: 'ledgerId',
                            as: 'trans',
                        },
                    },
                    { $unwind: '$trans' },
                    {
                        $group: {
                            _id: '$trans.type',
                            total: { $sum: '$totalAmount' },
                        },
                    },
                ])
                let income = 0
                let expense = 0
                result.forEach((r) => {
                    if (r._id === 'CREDIT') income = r.total
                    if (r._id === 'DEBIT') expense = r.total
                })
                return { income, expense, savings: income - expense }
            }

            const current = await calculateTotals(currentMonthStart, currentMonthEnd)
            const previous = await calculateTotals(prevMonthStart, prevMonthEnd)

            const calcPercentage = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0
                return Number((((curr - prev) / prev) * 100).toFixed(2))
            }

            const comparison = {
                incomeChange: calcPercentage(current.income, previous.income),
                expenseChange: calcPercentage(current.expense, previous.expense),
                savingsChange: calcPercentage(current.savings, previous.savings),
            }

            httpResponse(req, res, 200, 'Overview retrieved successfully', {
                currentMonth: current,
                previousMonth: previous,
                comparison,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getCategorySpending: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id

            // Allow client to query specific timeframe, default to all time
            const matchQuery = {
                userId: new mongoose.Types.ObjectId(userId),
                isDeleted: false,
                ledgerType: 'NORMAL',
            }
            if (req.query.startDate && req.query.endDate) {
                matchQuery.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) }
            }

            const categories = await Ledger.aggregate([
                { $match: matchQuery },
                {
                    $lookup: {
                        from: 'transactions',
                        localField: '_id',
                        foreignField: 'ledgerId',
                        as: 'trans',
                    },
                },
                { $unwind: '$trans' },
                { $match: { 'trans.type': 'DEBIT' } },
                {
                    $group: {
                        _id: '$categoryId',
                        totalAmount: { $sum: '$totalAmount' },
                    },
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: '$category' },
                {
                    $project: {
                        _id: 0,
                        categoryName: '$category.name',
                        totalAmount: 1,
                    },
                },
                { $sort: { totalAmount: -1 } },
            ])

            const grandTotal = categories.reduce((sum, c) => sum + c.totalAmount, 0)
            const formatted = categories.map((c) => ({
                categoryName: c.categoryName,
                totalAmount: Number(c.totalAmount.toFixed(2)),
                percentageOfTotal: grandTotal === 0 ? 0 : Number(((c.totalAmount / grandTotal) * 100).toFixed(2)),
            }))

            httpResponse(req, res, 200, 'Category spending retrieved successfully', formatted)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getTrend: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const timezone = req.query.timezone || 'Asia/Kolkata'

            let trendStart, trendEnd
            if (req.query.startDate && req.query.endDate) {
                trendStart = dayjs(req.query.startDate).tz(timezone).startOf('day').toDate()
                trendEnd = dayjs(req.query.endDate).tz(timezone).endOf('day').toDate()
            } else {
                trendEnd = dayjs().tz(timezone).endOf('day').toDate()
                trendStart = dayjs().tz(timezone).subtract(30, 'day').startOf('day').toDate()
            }

            const trend = await Ledger.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId),
                        isDeleted: false,
                        ledgerType: 'NORMAL',
                        date: { $gte: trendStart, $lte: trendEnd },
                    },
                },
                {
                    $lookup: {
                        from: 'transactions',
                        localField: '_id',
                        foreignField: 'ledgerId',
                        as: 'trans',
                    },
                },
                { $unwind: '$trans' },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: timezone } },
                        dailyIncome: {
                            $sum: { $cond: [{ $eq: ['$trans.type', 'CREDIT'] }, '$totalAmount', 0] },
                        },
                        dailyExpense: {
                            $sum: { $cond: [{ $eq: ['$trans.type', 'DEBIT'] }, '$totalAmount', 0] },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ])

            const formatted = trend.map((t) => ({
                date: t._id,
                dailyIncome: Number(t.dailyIncome.toFixed(2)),
                dailyExpense: Number(t.dailyExpense.toFixed(2)),
            }))

            httpResponse(req, res, 200, 'Trend retrieved successfully', formatted)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getAccountDistribution: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const accounts = await Account.find({
                userId,
                isDeleted: false,
                isActive: true,
            }).select('name balance type')

            const formatted = accounts.map((a) => ({
                accountName: a.name,
                type: a.type,
                balance: Number(a.balance.toFixed(2)),
            }))

            httpResponse(req, res, 200, 'Account distribution retrieved successfully', formatted)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getRecentActivity: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id

            // For recent activity, we just need the last 10 ledgers, and we lookup category and transactions
            const recentLedgers = await Ledger.find({ userId, isDeleted: false })
                .sort({ date: -1, createdAt: -1 })
                .limit(10)
                .populate('categoryId', 'name icon type')
                .lean()

            const ledgerIds = recentLedgers.map((l) => l._id)
            const transactions = await Transaction.find({ ledgerId: { $in: ledgerIds } })
                .populate('accountId', 'name')
                .lean()

            // Map transactions back to their ledgers
            const formatted = recentLedgers.map((ledger) => {
                const ledgerTrans = transactions.filter((t) => t.ledgerId.toString() === ledger._id.toString())
                return {
                    id: ledger._id,
                    title: ledger.title,
                    date: ledger.date,
                    amount: Number(ledger.totalAmount.toFixed(2)),
                    ledgerType: ledger.ledgerType,
                    category: ledger.categoryId ? ledger.categoryId.name : null,
                    icon: ledger.categoryId ? ledger.categoryId.icon : null,
                    categoryType: ledger.categoryId ? ledger.categoryId.type : null,
                    transactions: ledgerTrans.map((t) => ({
                        type: t.type,
                        accountId: t.accountId ? t.accountId._id : null,
                        accountName: t.accountId ? t.accountId.name : null,
                        amount: Number(t.amount.toFixed(2)),
                    })),
                }
            })

            httpResponse(req, res, 200, 'Recent activity retrieved successfully', formatted)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
