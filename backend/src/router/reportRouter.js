import express from 'express'
import authentication from '../middleware/authentication.js'
import reportController from '../controller/reportController.js'

const router = express.Router()

router.route('/overview').get(authentication, reportController.getOverview)
router.route('/categories').get(authentication, reportController.getCategorySpending)
router.route('/trend').get(authentication, reportController.getTrend)
router.route('/accounts-distribution').get(authentication, reportController.getAccountDistribution)
router.route('/upcoming').get(authentication, reportController.getUpcomingPayments)
router.route('/recent').get(authentication, reportController.getRecentActivity)
router.route('/export').post(authentication, reportController.exportReport)

export default router
