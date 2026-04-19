import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Loan from '../model/loanModel.js'
import Account from '../model/accountModel.js'
import Party from '../model/partiesModel.js'
import databseService from '../service/databseService.js'
import { validateJoiSchema, validationLoanBody } from '../service/validationService.js'

export default {
    /**
     * POST /loans
     * BORROWED → Account balance ↑, Party.netDebt ↓ (I owe them)
     * LENT     → Account balance ↓, Party.netDebt ↑ (They owe me)
     */
    createLoan: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationLoanBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const userId = req.authenticatedUser._id
            const user = await mongoose.model('User').findById(userId).select('plan')
            const plan = user?.plan || 'basic'
            const count = await Loan.countDocuments({ user: userId, isDeleted: false })
            const limit = plan === 'basic' ? 1 : 100

            if (count >= limit) {
                return httpError(next, new Error(`${plan.toUpperCase()} plan limit reached for personal debt records (${limit}).`), req, 403)
            }


            // Create Transaction via databseService to ensure ledger sync
            const transactionPayload = {
                userId,
                amount: value.amount,
                accountId: value.accountId,
                partyId: value.party,
                title: `${value.type === 'LENT' ? 'Money Lent to' : 'Money Borrowed from'} Party`,
                type: 'debt',
                debtType: value.type, // Pass LENT/BORROWED to service
                date: value.date || new Date(),
                interestRate: value.interestRate || 0,
                dueDate: value.dueDate || null,
            }

            const result = await databseService.createTransaction(transactionPayload)

            // Create loan record linked to this transaction entry
            const loan = await Loan.create({
                ...value,
                user: userId,
                transactionId: result.transaction._id,
            })

            // Populate for response
            const populated = await Loan.findById(loan._id).populate('party', 'name relation').populate('accountId', 'name type')

            httpResponse(req, res, 201, 'Loan created successfully', {
                loan: populated,
                transaction: result.transaction,
                updatedAccounts: result.updatedAccounts,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    /**
     * GET /loans — All active loans for authenticated user
     */
    getAllLoans: async (req, res, next) => {
        try {
            const loans = await Loan.find({
                user: req.authenticatedUser._id,
                isDeleted: false,
            })
                .populate('party', 'name relation netDebt')
                .populate('accountId', 'name type')
                .sort({ createdAt: -1 })

            httpResponse(req, res, 200, 'Loans retrieved successfully', loans)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    /**
     * PATCH /loans/:id — Update a loan
     */
    updateLoan: async (req, res, next) => {
        try {
            const { amount, dueDate, interestRate, status, accountId, party, date, type } = req.body
            
            const loan = await Loan.findOne({ 
                _id: req.params.id, 
                user: req.authenticatedUser._id, 
                isDeleted: false 
            })
            if (!loan) return httpError(next, 'Loan not found', req, 404)

            // Sync with Transaction if significant fields changed
            if (loan.transactionId) {
                const txPayload = {
                    accountId: accountId || loan.accountId,
                    partyId: party || loan.party,
                    amount: amount !== undefined ? amount : loan.amount,
                    date: date || loan.date,
                    type: 'debt',
                    debtType: type || loan.type,
                    title: `${(type || loan.type) === 'LENT' ? 'Money Lent to' : 'Money Borrowed from'} Party`,
                }
                await databseService.editTransaction(loan.transactionId, req.authenticatedUser._id, txPayload)
            }

            // Update Loan record
            if (amount !== undefined) loan.amount = amount
            if (dueDate !== undefined) loan.dueDate = dueDate
            if (interestRate !== undefined) loan.interestRate = interestRate
            if (status !== undefined) loan.status = status
            if (accountId !== undefined) loan.accountId = accountId
            if (party !== undefined) loan.party = party
            if (date !== undefined) loan.date = date
            if (type !== undefined) loan.type = type

            await loan.save()
            const populated = await Loan.findById(loan._id).populate('party', 'name relation').populate('accountId', 'name type')

            httpResponse(req, res, 200, 'Loan updated successfully', populated)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    /**
     * DELETE /loans/:id — Soft-delete a loan
     */
    deleteLoan: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const loan = await Loan.findOne({ 
                _id: req.params.id, 
                user: userId, 
                isDeleted: false 
            })
            if (!loan) return httpError(next, 'Loan not found', req, 404)

            // Reverse transaction if exists
            if (loan.transactionId) {
                await databseService.deleteTransaction(loan.transactionId, userId)
            }

            loan.isDeleted = true
            await loan.save()

            httpResponse(req, res, 200, 'Loan deleted successfully', loan)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    /**
     * POST /loans/:id/settle — Settle (repay) a loan
     */
    settleLoan: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const loan = await Loan.findOne({ _id: req.params.id, user: userId, isDeleted: false }).populate('party')
            if (!loan) return httpError(next, 'Loan not found', req, 404)
            if (loan.status === 'PAID') return httpError(next, 'Loan is already settled', req, 400)

            // Create Transaction to reverse the balance effect
            // If BORROWED originally (money in), settlement is an EXPENSE (money out)
            // If LENT originally (money out), settlement is an INCOME (money in)
            const transactionPayload = {
                userId,
                amount: loan.amount, // Full settlement
                accountId: loan.accountId,
                partyId: loan.party._id,
                title: `Settled: ${loan.type === 'LENT' ? 'Repayment Received' : 'Repayment Paid'}`,
                type: 'debt', // Still a debt type transaction
                debtType: loan.type === 'BORROWED' ? 'REPAYMENT_OUT' : 'REPAYMENT_IN', // Custom flow
                date: new Date(),
                loanId: loan._id
            }

            const result = await databseService.createTransaction(transactionPayload)

            // Mark as PAID
            loan.status = 'PAID'
            await loan.save()

            const populated = await Loan.findById(loan._id).populate('party', 'name relation').populate('accountId', 'name type')

            httpResponse(req, res, 200, 'Loan settled successfully', {
                loan: populated,
                transaction: result.transaction,
                updatedAccounts: result.updatedAccounts,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}

