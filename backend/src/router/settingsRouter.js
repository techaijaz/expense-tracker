import { Router } from 'express'
import settingsController from '../controller/settingsController.js'
import authentication from '../middleware/authentication.js'

const router = Router()

router.route('/')
    .get(authentication, settingsController.getSettings)
    .put(authentication, settingsController.updateSettings)

export default router
