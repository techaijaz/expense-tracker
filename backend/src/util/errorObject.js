import responceseMessage from '../constent/responceseMessage.js'
import config from '../config/config.js'
import { EApplicationEnvionment } from '../constent/application.js'
import logger from './loger.js'

export default (error, req, errorStatusCode = 500) => {
    const errorObj = {
        success: false,
        statusCode: errorStatusCode,
        request: {
            ip: req.ip || null,
            method: req.method,
            url: req.originalUrl,
        },
        message: error instanceof Error ? error.message || responceseMessage.ERROR : typeof error === 'string' ? error : responceseMessage.ERROR,
        data: error,
        trace: error instanceof Error ? { error: error.stack } : null,
    }

    // Log (Sanitized for BSON/MongoDB constraints)
    // logger.info('CONTROLLER_RESPONSE', {
    //     meta: JSON.parse(JSON.stringify(errorObj)),
    // })

    //Production env check
    if (config.ENV === EApplicationEnvionment.PRODUCTION) {
        delete errorObj.request.ip
        delete errorObj.trace
    }
    return errorObj
}
