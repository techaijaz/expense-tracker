import express from 'express'
import budgetController from '../controller/budgetController.js'
import authentication from '../middleware/authentication.js'

const router = express.Router()

router.use(authentication)

router.post('/', budgetController.upsertBudget)
router.get('/performance', budgetController.getBudgetPerformance)
router.delete('/:id', budgetController.deleteBudget)

export default router
