import { Router } from 'express'
import recurringController from '../controller/recurringController.js'
import authentication from '../middleware/authentication.js'

const router = Router()

router.get('/', authentication, recurringController.getRecurringTasks)
router.post('/', authentication, recurringController.createRecurringTask)
router.put('/:id', authentication, recurringController.updateRecurringTask)
router.delete('/:id', authentication, recurringController.deleteRecurringTask)
router.patch('/:id/toggle', authentication, recurringController.toggleTaskStatus)
router.get('/:id/history', authentication, recurringController.getRecurringHistory)

export default router
