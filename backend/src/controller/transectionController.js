import responceseMessage from '../constent/responceseMessage.js'
import databseService from '../service/databseService.js'
import { validateJoiSchema, validationTransectionBody } from '../service/validationService.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)

export default {
    addTransection: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { body } = req
            console.log(body)

            // * body validation
            const { error, value } = validateJoiSchema(validationTransectionBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { amount, category, account, description, type, date, partyId, toAccountId, ledgerType } = value

            const payload = {
                userId: userId,
                date: dayjs(date).utc().toDate(),
                amount,
                categoryId: category,
                accountId: account,
                title: description,
                type: type,
                partyId: partyId || null,
                toAccountId: toAccountId || null,
                ledgerType: ledgerType || 'NORMAL',
            }

            const result = await databseService.createTransaction(payload)

            httpResponse(req, res, 200, responceseMessage.SUCCESS, result)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getAllTransections: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            console.log('User ID:', userId, 'Query Params:', req.query)

            // Extract and validate query parameters
            const { search, dateFrom, dateTo, category, account, amount, description, type, limit = 10, page = 1 } = req.query

            // Build a safe filter object
            const filters = {
                search,
                dateRange: {
                    from: dateFrom ? new Date(dateFrom) : null,
                    to: dateTo ? new Date(dateTo) : null,
                },
                category,
                account,
                amount,
                description: description?.substring(0, 1000), // Limit text length
                type,
                pagination: {
                    limit: Math.max(1, Math.min(parseInt(limit) || 10, 100)), // Keep limit within 1-100
                    skip: page > 1 ? (page - 1) * filters.pagination.limit : 0, // Ensure page is at least 1
                },
            }

            console.log('Applying Filters:', filters)

            const { transactions, totalCount } = await databseService.getAllTransections(userId, filters)

            httpResponse(req, res, 200, 'Transactions retrieved successfully', {
                transactions,
                pagination: {
                    total: totalCount,
                    page: filters.pagination.page,
                    pages: Math.ceil(totalCount / filters.pagination.limit),
                    limit: filters.pagination.limit,
                },
            })
        } catch (error) {
            console.error('Error fetching transactions:', error)
            httpError(next, error, req, 500)
        }
    },
    gettotals: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const totalBalance = await databseService.getTotalBalance(userId)
            const totalsIncome = await databseService.getTotalIncome(userId)
            const totalsExpense = await databseService.getTotalExpense(userId)
            const totals = {
                totalBalance: totalBalance[0]?.totalBalance,
                totalsIncome: totalsIncome[0]?.totalIncome,
                totalsExpense: totalsExpense[0]?.totalExpense,
            }
            httpResponse(req, res, 200, responceseMessage.SUCCESS, totals)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    editTransaction: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const ledgerId = req.params.id
            const { body } = req

            const { error, value } = validateJoiSchema(validationTransectionBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const payload = {
                userId: userId,
                date: dayjs(value.date).utc().toDate(),
                amount: value.amount,
                categoryId: value.category,
                accountId: value.account,
                title: value.description,
                type: value.type,
                partyId: value.partyId || null,
                toAccountId: value.toAccountId || null,
                ledgerType: value.ledgerType || 'NORMAL',
            }

            const result = await databseService.editTransaction(ledgerId, userId, payload)
            httpResponse(req, res, 200, 'Transaction updated successfully', result)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    deleteTransaction: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const ledgerId = req.params.id

            await databseService.deleteTransaction(ledgerId, userId)
            httpResponse(req, res, 200, 'Transaction deleted successfully')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
