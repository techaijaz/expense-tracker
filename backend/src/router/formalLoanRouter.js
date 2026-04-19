import express from 'express'
import formalLoanController from '../controller/formalLoanController.js'
import authentication from '../middleware/authentication.js'

const router = express.Router()

router.use(authentication)

router.post('/', formalLoanController.createLoan)
router.get('/', formalLoanController.getLoans)
router.get('/:id', formalLoanController.getLoanDetails)
router.post('/pay-emi', formalLoanController.payEMI)
router.post('/prepay', formalLoanController.prepayLoan)
router.post('/simulate-prepayment', formalLoanController.simulatePrepayment)

export default router

