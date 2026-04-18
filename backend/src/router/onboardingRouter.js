import { Router } from 'express'
import onboardingController from '../controller/onboardingController.js'
import authentication from '../middleware/authentication.js'

const router = Router()

router.use(authentication)

router.route('/complete').post(onboardingController.complete)
router.route('/skip').post(onboardingController.skip)

export default router
