import express from 'express'
import authentication from '../middleware/authentication.js'
import transectionController from '../controller/transectionController.js'

const router = express.Router()

router.route('/').post(authentication, transectionController.addTransection).get(authentication, transectionController.getAllTransections)

router.route('/:id').put(authentication, transectionController.editTransaction).delete(authentication, transectionController.deleteTransaction)

router.route('/gettotals').get(authentication, transectionController.gettotals)

export default router
