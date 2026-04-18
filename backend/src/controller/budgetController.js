import budgetModel from '../model/budgetModel.js'
import budgetPeriodModel from '../model/budgetPeriodModel.js'
import budgetService from '../service/budgetService.js'
import { validateJoiSchema, validationBudgetBody } from '../service/validationService.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import dayjs from 'dayjs'

export default {
    upsertBudget: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationBudgetBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const userId = req.authenticatedUser._id
            const { categoryId, amount, period, alertThreshold, rollover, notes } = value

            const updatedBudget = await budgetModel.findOneAndUpdate(
                { userId, categoryId },
                { $set: { amount, period, alertThreshold, rollover, notes, isActive: true } },
                { upsert: true, new: true }
            )

            // Trigger progress update for current month
            await budgetService.updateBudgetProgress(userId, categoryId, new Date())

            httpResponse(req, res, 201, 'Budget set/updated successfully', updatedBudget)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getBudgetPerformance: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const progress = await budgetService.getBudgetProgress(userId)
            httpResponse(req, res, 200, 'Budget performance retrieved', progress)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    deleteBudget: async (req, res, next) => {
        try {
            const { id } = req.params
            await budgetModel.findByIdAndUpdate(id, { isActive: false })
            httpResponse(req, res, 200, 'Budget deactivated', null)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
