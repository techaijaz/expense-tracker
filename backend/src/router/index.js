import { Router } from 'express'
import apiRouter from './apiRouter.js'
import userRouter from './userRouter.js'
import accountRouter from './accountRouter.js'
import catagoryRouter from './catagoryRoutes.js'
import transectionRouter from './transectionRouter.js'

const router = Router()

router.use('/', apiRouter)
router.use('/user', userRouter)
router.use('/account', accountRouter)
router.use('/catagory', catagoryRouter)
router.use('/transactions', transectionRouter)

export default router
