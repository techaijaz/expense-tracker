import express from 'express'
import netWorthController from '../controller/netWorthController.js'
import authentication from '../middleware/authentication.js'

const router = express.Router()

router.use(authentication)

router.get('/', netWorthController.getNetWorth)
router.get('/history', netWorthController.getHistory)

export default router
