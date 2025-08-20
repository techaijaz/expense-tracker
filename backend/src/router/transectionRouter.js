import express from 'express'
import authentication from '../middleware/authentication.js'
import transectionController from '../controller/transectionController.js'

const router = express.Router()

// add catagory
router.route('/add').post(authentication, transectionController.addTransection)
router.route('/all').get(authentication, transectionController.getAllTransections)
router.route('/gettotals').get(authentication, transectionController.gettotals)

export default router
