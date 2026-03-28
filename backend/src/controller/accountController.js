import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Account from '../model/accountModel.js'
import { validateJoiSchema, validationAccountBody } from '../service/validationService.js'

export default {
    createAccount: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationAccountBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const account = await Account.create({
                ...value,
                userId: req.authenticatedUser._id,
            })
            httpResponse(req, res, 201, 'Account created successfully', account)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getAllAccounts: async (req, res, next) => {
        try {
            const accounts = await Account.find({
                userId: req.authenticatedUser._id,
                isDeleted: false,
            }).sort({ createdAt: -1 })
            httpResponse(req, res, 200, 'Accounts retrieved successfully', accounts)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    updateAccount: async (req, res, next) => {
        try {
            // Prevent manual balance edits to maintain data integrity
            const { name, type, isActive, currency } = req.body
            const updateFields = {}
            if (name !== undefined) updateFields.name = name
            if (type !== undefined) updateFields.type = type
            if (isActive !== undefined) updateFields.isActive = isActive
            if (currency !== undefined) updateFields.currency = currency

            const account = await Account.findOneAndUpdate(
                { _id: req.params.id, userId: req.authenticatedUser._id, isDeleted: false },
                { $set: updateFields },
                { new: true, runValidators: true }
            )
            if (!account) return httpError(next, 'Account not found', req, 404)
            httpResponse(req, res, 200, 'Account updated successfully', account)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    deleteAccount: async (req, res, next) => {
        try {
            const account = await Account.findOneAndUpdate(
                { _id: req.params.id, userId: req.authenticatedUser._id, isDeleted: false },
                { $set: { isDeleted: true } },
                { new: true }
            )
            if (!account) return httpError(next, 'Account not found', req, 404)
            httpResponse(req, res, 200, 'Account soft-deleted successfully', account)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
