import { Router } from 'express'
import apiRouter from './apiRouter.js'
import userRouter from './userRouter.js'
import accountRouter from './accountRouter.js'
import catagoryRouter from './catagoryRoutes.js'
import transectionRouter from './transectionRouter.js'
import partyRouter from './partyRouter.js'
import reportRouter from './reportRouter.js'
import loanRouter from './loanRouter.js'
import formalLoanRouter from './formalLoanRouter.js'
import budgetRouter from './budgetRouter.js'
import netWorthRouter from './netWorthRouter.js'
import settingsRouter from './settingsRouter.js'
import onboardingRouter from './onboardingRouter.js'
import recurringRouter from './recurringRouter.js'
import assetRouter from './assetRouter.js'
import subscriptionRouter from './subscriptionRouter.js'
import adminRouter from './adminRouter.js'

const router = Router()

router.use('/', apiRouter)
router.use('/user', userRouter)
router.use('/onboarding', onboardingRouter)
router.use('/account', accountRouter)
router.use('/catagory', catagoryRouter)
router.use('/transactions', transectionRouter)
router.use('/parties', partyRouter)
router.use('/reports', reportRouter)
router.use('/loans', loanRouter)
router.use('/formal-loans', formalLoanRouter)
router.use('/budget', budgetRouter)
router.use('/net-worth', netWorthRouter)
router.use('/settings', settingsRouter)
router.use('/recurring', recurringRouter)
router.use('/assets', assetRouter)
router.use('/subscription', subscriptionRouter)
router.use('/admin', adminRouter)

export default router
