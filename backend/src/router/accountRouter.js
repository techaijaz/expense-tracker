import express from 'express'
import authentication from '../middleware/authentication.js'
import accountController from '../controller/accountController.js'

const router = express.Router()

router.route('/').post(authentication, accountController.createAccount).get(authentication, accountController.getAllAccounts)

router.route('/:id').patch(authentication, accountController.updateAccount).delete(authentication, accountController.deleteAccount)
router.route('/:id/opening-balance').get(authentication, accountController.getOpeningBalance)

export default router
