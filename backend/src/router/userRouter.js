import { Router } from 'express'
import userController from '../controller/userController.js'
import authentication from '../middleware/authentication.js'
import { uploadAvatar } from '../middleware/upload.js'

const router = Router()

router.route('/register').post(userController.register)
router.route('/login').post(userController.login)
router.route('/self-identification').get(authentication, userController.selfIdentification)
router.route('/logout').put(authentication, userController.logout)
router.route('/refresh-token').post(userController.refreshToken)
router.route('/change-password').put(authentication, userController.changePassword)
router.route('/avatar').put(authentication, uploadAvatar, userController.uploadAvatarHandler)
router.route('/preferences').put(authentication, userController.updatePreferences)
router.route('/complete-onboarding').put(authentication, userController.completeOnboarding)
router.route('/storage-stats').get(authentication, userController.getStorageStats)
router.route('/hard-reset').delete(authentication, userController.hardReset)
router.route('/verify-email').get(userController.verifyEmail)
router.route('/resend-verification').post(userController.resendVerification)
router.route('/forgot-password').post(userController.forgotPassword)
router.route('/reset-password').post(userController.resetPassword)
router.route('/export').get(authentication, userController.exportData)

export default router
