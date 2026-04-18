import { Router } from 'express'
import recurringController from '../controller/recurringController.js'

const router = Router()

router.get('/', recurringController.getRecurringTasks)
router.post('/', recurringController.createRecurringTask)
router.put('/:id', recurringController.updateRecurringTask)
router.delete('/:id', recurringController.deleteRecurringTask)
router.patch('/:id/toggle', recurringController.toggleTaskStatus)
router.get('/:id/history', recurringController.getRecurringHistory)

export default router
