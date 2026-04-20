import { Router } from 'express'
import adminController from '../controller/adminController.js'
import authentication, { isAdmin } from '../middleware/authentication.js'

const router = Router()

// All routes here require authentication AND admin role
router.use(authentication)
router.use(isAdmin)

router.get('/stats', adminController.getDashboardStats)
router.get('/users', adminController.getUsers)
router.get('/settings', adminController.getGlobalSettings)
router.patch('/settings', adminController.updateGlobalSettings)
router.get('/payments/pending', adminController.getPendingPayments)
router.post('/payments/verify', adminController.verifyPayment)

export default router
