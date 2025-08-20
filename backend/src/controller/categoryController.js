import { validateJoiSchema, validationCategoryBody } from '../service/validationService.js'
import responceseMessage from '../constent/responceseMessage.js'
import databseService from '../service/databseService.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'

export default {
    getAllCategories: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id // Assuming user ID is stored in req.user
            const categories = await databseService.getAllCategories(userId)
            httpResponse(req, res, 200, responceseMessage.SUCCESS, categories)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    createCategory: async (req, res, next) => {
        try {
            const { body } = req

            // * body validation
            const { error, value } = validateJoiSchema(validationCategoryBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { name } = value
            const userId = req.authenticatedUser._id // Assuming user ID is stored in req.user

            // * find category by user id and name
            const category = await databseService.findCategoryByUserIdAndName(userId, name)
            if (!category) {
                httpError(next, responceseMessage.CATEGORY_FOUND, req, 422)
            }
            const payload = {
                user: userId,
                name,
            }

            // * create category
            const newCategory = await databseService.createCategory(payload)

            httpResponse(req, res, 200, responceseMessage.SUCCESS, newCategory)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    addCatagory: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { body } = req

            // * body validation
            const { error, value } = validateJoiSchema(validationCategoryBody, body)
            if (error) {
                return httpError(next, error, req, 422)
            }

            const { name } = value

            // * find category by user id and name
            const category = await databseService.findCategoryByUserIdAndName(userId, name)
            if (category) {
                httpError(next, responceseMessage.CATEGORY_FOUND, req, 422)
            }

            const categories = await databseService.getAllCategories(userId)
            if (categories.length > 10) {
                httpError(next, responceseMessage.Limit_CATEGORY_10, req, 422)
            }

            const payload = {
                user: userId,
                name,
            }

            // * create category
            const newCategory = await databseService.addCatagory(payload)

            httpResponse(req, res, 200, responceseMessage.SUCCESS, newCategory)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
