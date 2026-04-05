import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Loan from '../model/loanModel.js'
import Account from '../model/accountModel.js'
import Party from '../model/partiesModel.js'
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

            // Validate account belongs to user
            const account = await Account.findOne({ _id: value.accountId, userId, isDeleted: false })
            if (!account) return httpError(next, 'Account not found', req, 404)

            // Validate party belongs to user
            const party = await Party.findOne({ _id: value.party, userId, isDeleted: false })
            if (!party) return httpError(next, 'Party not found', req, 404)

            // Balance check for LENT (money going out)
            if (value.type === 'LENT' && account.balance < value.amount) {
                return httpError(next, 'Insufficient balance to lend this amount', req, 400)
            }

            // Update Account balance
            const balanceChange = value.type === 'BORROWED' ? value.amount : -value.amount
            await Account.findByIdAndUpdate(value.accountId, { $inc: { balance: balanceChange } })

            // Update Party netDebt
            // BORROWED: I owe them → netDebt decreases (negative = I owe)
            // LENT: They owe me → netDebt increases (positive = they owe)
            const debtChange = value.type === 'LENT' ? value.amount : -value.amount
            await Party.findByIdAndUpdate(value.party, { $inc: { netDebt: debtChange } })

            // Create loan record
            const loan = await Loan.create({ ...value, user: userId })

            // Populate for response
            const populated = await Loan.findById(loan._id).populate('party', 'name relation').populate('accountId', 'name type')

            httpResponse(req, res, 201, 'Loan created successfully', populated)
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
            const { amount, dueDate, interestRate, status } = req.body
            const updateFields = {}
            if (amount !== undefined) updateFields.amount = amount
            if (dueDate !== undefined) updateFields.dueDate = dueDate
            if (interestRate !== undefined) updateFields.interestRate = interestRate
            if (status !== undefined) updateFields.status = status

            const loan = await Loan.findOneAndUpdate(
                { _id: req.params.id, user: req.authenticatedUser._id, isDeleted: false },
                { $set: updateFields },
                { new: true, runValidators: true }
            )
                .populate('party', 'name relation')
                .populate('accountId', 'name type')

            if (!loan) return httpError(next, 'Loan not found', req, 404)
            httpResponse(req, res, 200, 'Loan updated successfully', loan)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    /**
     * DELETE /loans/:id — Soft-delete a loan
     */
    deleteLoan: async (req, res, next) => {
        try {
            const loan = await Loan.findOneAndUpdate(
                { _id: req.params.id, user: req.authenticatedUser._id, isDeleted: false },
                { $set: { isDeleted: true } },
                { new: true }
            )
            if (!loan) return httpError(next, 'Loan not found', req, 404)
            httpResponse(req, res, 200, 'Loan deleted successfully', loan)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    /**
     * POST /loans/:id/settle — Settle (repay) a loan
     * Reverses the original balance/debt changes and marks status = PAID
     */
    settleLoan: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const loan = await Loan.findOne({ _id: req.params.id, user: userId, isDeleted: false })
            if (!loan) return httpError(next, 'Loan not found', req, 404)
            if (loan.status === 'PAID') return httpError(next, 'Loan is already settled', req, 400)

            // Reverse the original balance change
            // BORROWED originally added money → now subtract it back
            // LENT originally subtracted money → now add it back
            const reverseBalance = loan.type === 'BORROWED' ? -loan.amount : loan.amount
            const account = await Account.findById(loan.accountId)
            if (!account) return httpError(next, 'Associated account not found', req, 404)

            // Balance check for BORROWED settlement (money going out)
            if (loan.type === 'BORROWED' && account.balance < loan.amount) {
                return httpError(next, 'Insufficient balance to settle this debt', req, 400)
            }

            await Account.findByIdAndUpdate(loan.accountId, { $inc: { balance: reverseBalance } })

            // Reverse the original debt change
            const reverseDebt = loan.type === 'LENT' ? -loan.amount : loan.amount
            await Party.findByIdAndUpdate(loan.party, { $inc: { netDebt: reverseDebt } })

            // Mark as PAID
            loan.status = 'PAID'
            await loan.save()

            const populated = await Loan.findById(loan._id).populate('party', 'name relation').populate('accountId', 'name type')

            httpResponse(req, res, 200, 'Loan settled successfully', populated)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
