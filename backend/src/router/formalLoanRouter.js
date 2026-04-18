import express from 'express'
import formalLoanController from '../controller/formalLoanController.js'
import authentication from '../middleware/authentication.js'

const router = express.Router()

router.use(authentication)

router.post('/', formalLoanController.createLoan)
router.get('/', formalLoanController.getLoans)
router.get('/:id', formalLoanController.getLoanDetails)
router.post('/pay-emi', formalLoanController.payEMI)

export default router

