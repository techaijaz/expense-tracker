import { Router } from 'express'
import apiRouter from './apiRouter.js'
import userRouter from './userRouter.js'
import accountRouter from './accountRouter.js'
import catagoryRouter from './catagoryRoutes.js'
import transectionRouter from './transectionRouter.js'
import partyRouter from './partyRouter.js'
import reportRouter from './reportRouter.js'
import loanRouter from './loanRouter.js'

const router = Router()

router.use('/', apiRouter)
router.use('/user', userRouter)
router.use('/account', accountRouter)
router.use('/catagory', catagoryRouter)
router.use('/transactions', transectionRouter)
router.use('/parties', partyRouter)
router.use('/reports', reportRouter)
router.use('/loans', loanRouter)

export default router
