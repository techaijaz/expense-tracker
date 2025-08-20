import express from 'express'
import accountController from '../controller/accountController.js'
import authentication from '../middleware/authentication.js'

const router = express.Router()

// Route to create a new account
router.route('/create').post(authentication, accountController.createAccount)

// Route to get all accounts of a user
router.route('/get').get(authentication, accountController.getAllAccounts)

// Route to update an account
router.route('/update/:id').put(authentication, accountController.updateAccount)

// Route to update an balance
router.route('/add-amount/:id').put(authentication, accountController.addAmount)

// Route to fund transfer
router.route('/transfer-funds').post(authentication, accountController.transferFund)

// Additional routes can be added here, e.g., for fetching accounts, updating, deleting, etc.

export default router
