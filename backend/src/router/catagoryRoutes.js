import express from 'express'
import authentication from '../middleware/authentication.js'
import categoryController from '../controller/categoryController.js'

const router = express.Router()

router.route('/').post(authentication, categoryController.createCategory).get(authentication, categoryController.getAllCategories)
router.route('/add').post(authentication, categoryController.createCategory)
router.route('/:id').patch(authentication, categoryController.updateCategory).delete(authentication, categoryController.deleteCategory)

export default router
