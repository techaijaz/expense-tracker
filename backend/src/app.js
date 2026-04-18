import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import router from './router/index.js'
import globalErrorHandler, { notFoundError } from './middleware/globalErrorHandler.js'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import config from './config/config.js'
import swaggerUi from 'swagger-ui-express'
import authentication from './middleware/authentication.js'
import { readFileSync } from 'fs'

const swaggerFile = JSON.parse(readFileSync(new URL('../swagger-output.json', import.meta.url)))

const app = express()
//Middlewares
//Middlewares
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
                imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net', 'http://localhost:*', 'https://*'],
                connectSrc: ["'self'", 'http://localhost:*', 'https://*'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
)
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

// Serve static files from the 'public' directory at the root
app.use(express.static(path.resolve(__dirname, '..', 'public')))

//Routs
//Routs
app.use('/api-docs', authentication, swaggerUi.serve, swaggerUi.setup(swaggerFile))
app.use('/api/v1', router)

//404 Error handeler
app.use(notFoundError)

//Global Error handeler
app.use(globalErrorHandler)

export default app
