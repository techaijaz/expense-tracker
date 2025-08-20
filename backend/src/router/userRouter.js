import { Router } from 'express'
import userController from '../controller/userController.js'
import authentication from '../middleware/authentication.js'

const router = Router()

router.route('/register').post(userController.register)
// router.route('/confirmation/:token').put(userController.confirmation)
router.route('/login').post(userController.login)
router.route('/self-identification').get(authentication, userController.selfIdentification)
router.route('/logout').put(authentication, userController.logout)
router.route('/refresh-token').post(userController.refresshToken)
// router.route('/forgot-password').put(userController.forgotPassword)
// router.route('/reset-password/:token').put(userController.resetPassword)
// router.route('/change-password').put(authentication, userController.changePassword)

export default router
