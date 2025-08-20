import { EApplicationEnvionment } from '../constent/application.js'
import config from '../config/config.js'
import { rateLimiterMongo } from '../config/rateLimiter.js'
import httpError from '../util/httpError.js'
import responceseMessage from '../constent/responceseMessage.js'

export default (req, res, next) => {
    if (config.ENV === EApplicationEnvionment.DEVELOPMENT) {
        return next()
    }
    if (rateLimiterMongo) {
        rateLimiterMongo
            .consume(req.ip, 1)
            .then(() => {
                next()
            })
            .catch(() => {
                httpError(next, new Error(responceseMessage.TOO_MANY_REQUEST), req, 429)
            })
    }
}
