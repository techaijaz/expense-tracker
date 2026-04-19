import responceseMessage from '../constent/responceseMessage.js'
import databseService from '../service/databseService.js'
import { validateJoiSchema, validationRecurringBody } from '../service/validationService.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'
import dayjs from 'dayjs'

export default {
    getRecurringTasks: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const tasks = await databseService.getAllRecurringTasks(userId)
            httpResponse(req, res, 200, 'Recurring tasks retrieved successfully', tasks)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    createRecurringTask: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { body } = req

            const { error, value } = validateJoiSchema(validationRecurringBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const user = await databseService.findUserById(userId)
            const plan = user?.plan || 'basic'
            const count = await databseService.countRecurringTasks(userId)
            const limit = plan === 'basic' ? 1 : 100

            if (count >= limit) {
                return httpError(next, new Error(`${plan.toUpperCase()} plan limit reached for recurring tasks (${limit}).`), req, 403)
            }


            const payload = {
                ...value,
                userId,
                nextDueDate: value.startDate, // Initialize nextDueDate as startDate
                categoryId: value.categoryId === '' ? null : value.categoryId,
                toAccountId: value.toAccountId === '' ? null : value.toAccountId,
            }

            const task = await databseService.createRecurringTask(payload)
            httpResponse(req, res, 201, 'Recurring task created successfully', task)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateRecurringTask: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const taskId = req.params.id
            const { body } = req

            const { error, value } = validateJoiSchema(validationRecurringBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const sanitizedValue = {
                ...value,
                categoryId: value.categoryId === '' ? null : value.categoryId,
                toAccountId: value.toAccountId === '' ? null : value.toAccountId,
            }

            const task = await databseService.updateRecurringTask(taskId, userId, sanitizedValue)
            if (!task) {
                return httpError(next, 'Task not found', req, 404)
            }

            httpResponse(req, res, 200, 'Recurring task updated successfully', task)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    deleteRecurringTask: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const taskId = req.params.id

            const task = await databseService.deleteRecurringTask(taskId, userId)
            if (!task) {
                return httpError(next, 'Task not found', req, 404)
            }

            httpResponse(req, res, 200, 'Recurring task deleted successfully')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    toggleTaskStatus: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const taskId = req.params.id

            const task = await databseService.findRecurringById(taskId, userId)
            if (!task) {
                return httpError(next, 'Task not found', req, 404)
            }

            task.status = task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
            await task.save()

            httpResponse(req, res, 200, `Task status updated to ${task.status}`, task)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getRecurringHistory: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const taskId = req.params.id

            const transactions = await databseService.getTransactionsByRecurringId(taskId, userId)
            httpResponse(req, res, 200, 'Recurring history retrieved successfully', transactions)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
