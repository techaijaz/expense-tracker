import express from 'express'
import authentication from '../middleware/authentication.js'
import categoryController from '../controller/categoryController.js'
const router = express.Router()

// Route to create a new account
router.route('/all').get(authentication, categoryController.getAllCategories)

// cteate a new catagory
router.route('/create').post(authentication, categoryController.createCategory)

// add catagory
router.route('/add').post(authentication, categoryController.addCatagory)

export default router
