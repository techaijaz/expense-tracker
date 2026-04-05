import express from 'express'
import authentication from '../middleware/authentication.js'
import loanController from '../controller/loanController.js'

const router = express.Router()

router.route('/').post(authentication, loanController.createLoan).get(authentication, loanController.getAllLoans)

router.route('/:id').patch(authentication, loanController.updateLoan).delete(authentication, loanController.deleteLoan)

router.route('/:id/settle').post(authentication, loanController.settleLoan)

export default router
