import mongoose from 'mongoose'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Transaction from '../model/transactionModel.js'
import Account from '../model/accountModel.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import quarterOfYear from 'dayjs/plugin/quarterOfYear.js'
import reportGenerator from '../util/reportGenerator.js'
import emailService from '../util/emailService.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(quarterOfYear)

const getRange = (period, tz = 'Asia/Kolkata', preferences = {}) => {
    const now = dayjs().tz(tz)
    let start, end

    switch (period) {
        case 'quarterly':
            start = now.startOf('quarter').toDate()
            end = now.endOf('quarter').toDate()
            break
        case 'yearly':
            start = now.startOf('year').toDate()
            end = now.endOf('year').toDate()
            break
        case 'fy':
            const currentYear = now.year()
            const fyPref = preferences.fiscalYear || 'April-March'
            
            if (fyPref === 'January-December') {
                start = now.startOf('year').toDate()
                end = now.endOf('year').toDate()
            } else {
                // Default April-March
                const fiscalYearStart = now.month() < 3 ? currentYear - 1 : currentYear
                start = dayjs(`${fiscalYearStart}-04-01`).tz(tz).startOf('day').toDate()
                end = dayjs(`${fiscalYearStart + 1}-03-31`).tz(tz).endOf('day').toDate()
            }
            break
        case 'monthly':
        default:
            start = now.startOf('month').toDate()
            end = now.endOf('month').toDate()
            break
    }
    return { start, end }
}

export default {
    getOverview: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const timezone = req.query.timezone || 'Asia/Kolkata' 

            let currentStart, currentEnd, prevStart, prevEnd

            if (req.query.startDate && req.query.endDate) {
                currentStart = dayjs(req.query.startDate).tz(timezone).startOf('day').toDate()
                currentEnd = dayjs(req.query.endDate).tz(timezone).endOf('day').toDate()
                const durationDays = dayjs(currentEnd).diff(dayjs(currentStart), 'day')
                prevEnd = dayjs(currentStart).subtract(1, 'millisecond').toDate()
                prevStart = dayjs(prevEnd).subtract(durationDays, 'day').startOf('day').toDate()
            } else {
                const range = getRange(req.query.period, timezone, req.authenticatedUser.preferences)
                currentStart = range.start
                currentEnd = range.end
                
                // Calculate previous period for comparison
                const duration = dayjs(currentEnd).diff(dayjs(currentStart), 'millisecond') + 1
                prevEnd = dayjs(currentStart).subtract(1, 'millisecond').toDate()
                prevStart = dayjs(prevEnd).subtract(duration - 1, 'millisecond').startOf('day').toDate()
            }

            const calculateTotals = async (start, end) => {
                const result = await Transaction.aggregate([
                    {
                        $match: {
                            userId: new mongoose.Types.ObjectId(userId),
                            isDeleted: false,
                            date: { $gte: start, $lte: end },
                            type: { $in: ['income', 'expense'] }
                        },
                    },
                    {
                        $group: {
                            _id: '$type',
                            total: { $sum: '$amount' },
                        },
                    },
                ])
                let income = 0
                let expense = 0
                result.forEach((r) => {
                    if (r._id === 'income') income = r.total
                    if (r._id === 'expense') expense = r.total
                })
                return { income, expense, savings: income - expense }
            }

            const current = await calculateTotals(currentStart, currentEnd)
            const previous = await calculateTotals(prevStart, prevEnd)

            const calcPercentage = (curr, prev) => {
                if (prev === 0) return curr > 0 ? 100 : 0
                return Number((((curr - prev) / prev) * 100).toFixed(2))
            }

            httpResponse(req, res, 200, 'Overview retrieved successfully', {
                currentMonth: current,
                previousMonth: previous,
                comparison: {
                    incomeChange: calcPercentage(current.income, previous.income),
                    expenseChange: calcPercentage(current.expense, previous.expense),
                    savingsChange: calcPercentage(current.savings, previous.savings),
                },
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getCategorySpending: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const type = req.query.type || 'expense' // Filter by income or expense
            const timezone = req.query.timezone || 'Asia/Kolkata'

            const matchQuery = {
                userId: new mongoose.Types.ObjectId(userId),
                isDeleted: false,
                type: type.toLowerCase(),
            }
            if (req.query.startDate && req.query.endDate) {
                matchQuery.date = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) }
            } else {
                const range = getRange(req.query.period, timezone, req.authenticatedUser.preferences)
                matchQuery.date = { $gte: range.start, $lte: range.end }
            }

            const categories = await Transaction.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: '$categoryId',
                        totalAmount: { $sum: '$amount' },
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
                const range = getRange(req.query.period, timezone, req.authenticatedUser.preferences)
                trendStart = range.start
                trendEnd = range.end
            }

            const trend = await Transaction.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId),
                        isDeleted: false,
                        type: { $in: ['income', 'expense'] },
                        date: { $gte: trendStart, $lte: trendEnd },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: timezone } },
                        dailyIncome: {
                            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
                        },
                        dailyExpense: {
                            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
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
            const transactions = await Transaction.find({ userId, isDeleted: false })
                .sort({ date: -1, createdAt: -1 })
                .limit(10)
                .populate('categoryId', 'name icon type')
                .populate('accountId', 'name')
                .populate('targetAccountId', 'name')
                .lean()

            const formatted = transactions.map((t) => ({
                id: t._id,
                title: t.title,
                date: t.date,
                amount: Number(t.amount.toFixed(2)),
                type: t.type,
                category: t.categoryId ? t.categoryId.name : null,
                icon: t.categoryId ? t.categoryId.icon : null,
                accountName: t.accountId ? t.accountId.name : null,
                targetAccountName: t.targetAccountId ? t.targetAccountId.name : null,
            }))

            httpResponse(req, res, 200, 'Recent activity retrieved successfully', formatted)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    exportReport: async (req, res, next) => {
        const tempFiles = []
        try {
            const userId = req.authenticatedUser._id
            const userEmail = req.authenticatedUser.email
            const { type, period, timezone = 'Asia/Kolkata' } = req.body

            if (!userEmail) {
                return httpError(next, 'User email not found. Cannot send report.', req, 400)
            }

            // 1. Calculate Date Range based on period
            let startDate, endDate
            const now = dayjs().tz(timezone)

            switch (period) {
                case 'quarterly':
                    startDate = now.startOf('quarter').toDate()
                    endDate = now.endOf('quarter').toDate()
                    break
                case 'yearly':
                    startDate = now.startOf('year').toDate()
                    endDate = now.endOf('year').toDate()
                    break
                case 'fy':
                    // Financial Year (April to March)
                    const currentYear = now.year()
                    const fiscalYearStart = now.month() < 3 ? currentYear - 1 : currentYear
                    startDate = dayjs(`${fiscalYearStart}-04-01`).tz(timezone).startOf('day').toDate()
                    endDate = dayjs(`${fiscalYearStart + 1}-03-31`).tz(timezone).endOf('day').toDate()
                    break
                case 'monthly':
                default:
                    startDate = now.startOf('month').toDate()
                    endDate = now.endOf('month').toDate()
                    break
            }

            // 2. Fetch Data
            const transactions = await Transaction.find({
                userId,
                isDeleted: false,
                date: { $gte: startDate, $lte: endDate },
            })
                .sort({ date: -1 })
                .populate('categoryId', 'name')
                .populate('accountId', 'name')
                .populate('targetAccountId', 'name')
                .lean()

            const formattedData = transactions.map((t) => ({
                date: dayjs(t.date).format('YYYY-MM-DD'),
                title: t.title || 'Untitled',
                amount: t.amount,
                type: t.type,
                category: t.categoryId?.name || 'N/A',
                accountName: t.accountId?.name || 'N/A',
                targetAccountName: t.targetAccountId?.name || '',
            }))

            // 3. Generate Files
            const timestamp = Date.now()
            const exportDir = path.join(__dirname, '../../public/exports')
            const baseFileName = `report_${period}_${timestamp}`
            
            let reportFilePath
            let reportName

            if (type === 'csv') {
                reportName = `${baseFileName}.csv`
                reportFilePath = path.join(exportDir, reportName)
                await reportGenerator.generateCSV(formattedData, reportFilePath)
            } else {
                reportName = `${baseFileName}.pdf`
                reportFilePath = path.join(exportDir, reportName)
                await reportGenerator.generatePDF(formattedData, reportFilePath, {
                    period: period.toUpperCase(),
                })
            }
            tempFiles.push(reportFilePath)

            // 4. Create ZIP
            const zipName = `${baseFileName}.zip`
            const zipPath = path.join(exportDir, zipName)
            await reportGenerator.createZip([{ name: reportName, path: reportFilePath }], zipPath)
            tempFiles.push(zipPath)

            // 5. Email ZIP
            const emailResult = await emailService.sendEmail({
                to: userEmail,
                subject: `Your aiexpenser Financial Report - ${period.toUpperCase()}`,
                text: `Hello, please find attached your financial report for the period: ${period}.`,
                html: `<p>Hello,</p><p>Please find attached your financial report for the period: <b>${period}</b>.</p><p>Best regards,<br>aiexpenser Team</p>`,
                attachments: [
                    {
                        filename: zipName,
                        path: zipPath,
                    },
                ],
            })

            // 6. Cleanup
            await reportGenerator.cleanupFiles(tempFiles)

            if (emailResult.success) {
                httpResponse(req, res, 200, 'Report generated and emailed successfully')
            } else {
                httpError(next, `Failed to send email: ${emailResult.error}`, req, 500)
            }
        } catch (error) {
            // Ensure cleanup happens even on error
            await reportGenerator.cleanupFiles(tempFiles)
            httpError(next, error, req, 500)
        }
    },
}

