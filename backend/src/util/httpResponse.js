import config from '../config/config.js'
import { EApplicationEnvionment } from '../constent/application.js'
import logger from './loger.js'

export default (req, res, responseStatusCode, responseMessage, data = null) => {
    const response = {
        success: true,
        statusCode: responseStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl,
        },
        message: responseMessage,
        data: data,
    }
    // Log
    logger.info('CONTROLLER_RESPONSE', {
        meta: response,
    })

    //Production env check
    if (config.ENV === EApplicationEnvionment.PRODUCTION) {
        delete response.request.ip
    }

    res.status(responseStatusCode).json(response)
}
