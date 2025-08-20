import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import router from './router/index.js'
import globalErrorHandler, { notFoundError } from './middleware/globalErrorHandler.js'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import config from './config/config.js'

const app = express()
//Middlewares
app.use(helmet())
app.use(cookieParser())
app.use(
    cors({
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
        origin: config.FRONTEND_URL,
        credentials: true,
    })
)
app.use(express.json())

// Derive __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')))

//Routs
app.use('/api/v1', router)

//404 Error handeler
app.use(notFoundError)

//Global Error handeler
app.use(globalErrorHandler)

export default app
