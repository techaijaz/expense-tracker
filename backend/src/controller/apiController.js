import httpResponse from '../util/httpResponse.js'
import responceseMessage from '../constent/responceseMessage.js'
import httpError from '../util/httpError.js'
import quiker from '../util/quiker.js'

export default {
    self: (req, res, next) => {
        try {
            //throw new Error('this is error')
            httpResponse(req, res, 200, responceseMessage.SUCCESS, null)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    health: (req, res, next) => {
        try {
            const healthData = {
                application: quiker.getApplicationHealth(),
                system: quiker.getSystemHealth(),
                timeStamp: Date.now(),
            }
            httpResponse(req, res, 200, responceseMessage.SUCCESS, healthData)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
