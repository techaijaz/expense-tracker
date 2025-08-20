import config from './config/config.js'
import app from './app.js'
import logger from './util/loger.js'
import databseService from './service/databseService.js'
import { initRateLimiter } from './config/rateLimiter.js'
const server = app.listen(config.PORT, () => {})

;(async () => {
    try {
        const connection = await databseService.connect()

        logger.info('DATABASE CONNECTION', {
            meta: {
                CONNECTION_NAME: connection.name,
            },
        })
        initRateLimiter(connection)
        logger.info('RATE LIMITER INITIATE')

        logger.info('APPLICATION STARTED', {
            meta: {
                PORT: config.PORT,
                SERVVER_URL: config.SERVER_URL,
            },
        })
    } catch (error) {
        logger.error('APPLICATION STARTED', { meta: error })
        server.close(() => {
            if (error) {
                logger.error('APPLICATION STARTED', { meta: error })
            }
            process.exit(1)
        })
    }
})()
