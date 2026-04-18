import settingsModel from '../model/settingsModel.js'
import logger from '../util/loger.js'
import { validateJoiSchema, validationSettingsBody } from '../service/validationService.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import responceseMessage from '../constent/responceseMessage.js'

export default {
    getSettings: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            let settings = await settingsModel.findOne({ userId })

            if (!settings) {
                settings = await settingsModel.create({ userId })
                logger.info(`Settings initialized for existing user: ${userId}`)
            }

            httpResponse(req, res, 200, responceseMessage.SUCCESS, settings)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateSettings: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { error, value } = validateJoiSchema(validationSettingsBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const settings = await settingsModel.findOneAndUpdate(
                { userId },
                { $set: value },
                { new: true, upsert: true }
            )

            logger.info(`Settings updated for user: ${userId}`, { updatedFields: Object.keys(value) })
            httpResponse(req, res, 200, 'Settings updated successfully', settings)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
