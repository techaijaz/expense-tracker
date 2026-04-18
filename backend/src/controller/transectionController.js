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

            // * body validation
            const { error, value } = validateJoiSchema(validationTransectionBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const payload = {
                ...value,
                userId: userId,
                date: dayjs(value.date).utc().toDate(),
            }

            const result = await databseService.createTransaction(payload)

            // Populate the primary transaction for the frontend
            const populatedTransaction = await databseService.getPopulatedTransaction(result.transaction._id, userId)

            httpResponse(req, res, 200, responceseMessage.SUCCESS, {
                transaction: populatedTransaction,
                updatedAccounts: result.updatedAccounts,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getAllTransections: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { search, dateFrom, dateTo, categoryId, accountId, type, partyId, limit = 10, page = 1 } = req.query

            const parsedLimit = Math.max(1, Math.min(parseInt(limit) || 10, 100))
            const parsedPage = Math.max(1, parseInt(page) || 1)

            // 1. History Limit Logic for Basic Users
            const user = await databseService.findUserById(userId, 'plan')
            const plan = user?.plan || 'basic'
            
            let finalDateFrom = dateFrom ? new Date(dateFrom) : null
            if (plan === 'basic') {
                const threeMonthsAgo = dayjs().subtract(3, 'months').toDate()
                if (!finalDateFrom || finalDateFrom < threeMonthsAgo) {
                    finalDateFrom = threeMonthsAgo
                }
            }

            const filters = {
                search,
                dateRange: { from: finalDateFrom, to: dateTo ? new Date(dateTo) : null },
                categoryId,
                accountId,
                type,
                partyId,
                pagination: { limit: parsedLimit, page: parsedPage },
            }

            const { transactions, totalCount } = await databseService.getAllTransections(userId, filters)

            httpResponse(req, res, 200, 'Transactions retrieved successfully', {
                transactions,
                pagination: {
                    total: totalCount,
                    page: parsedPage,
                    pages: Math.ceil(totalCount / parsedLimit),
                    limit: parsedLimit,
                },
            })
        } catch (error) {
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
                totalBalance: totalBalance[0]?.totalBalance || 0,
                totalsIncome: totalsIncome[0]?.totalIncome || 0,
                totalsExpense: totalsExpense[0]?.totalExpense || 0,
            }
            httpResponse(req, res, 200, responceseMessage.SUCCESS, totals)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    editTransaction: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const transactionId = req.params.id
            const { body } = req

            const { error, value } = validateJoiSchema(validationTransectionBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const payload = {
                ...value,
                userId: userId,
                date: dayjs(value.date).utc().toDate(),
            }

            const result = await databseService.editTransaction(transactionId, userId, payload)
            const populatedTransaction = await databseService.getPopulatedTransaction(result.transaction._id, userId)

            httpResponse(req, res, 200, 'Transaction updated successfully', {
                transaction: populatedTransaction,
                updatedAccounts: result.updatedAccounts,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    deleteTransaction: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const transactionId = req.params.id

            const result = await databseService.deleteTransaction(transactionId, userId)
            httpResponse(req, res, 200, 'Transaction deleted successfully', result)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}

