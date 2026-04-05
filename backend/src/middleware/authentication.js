import quiker from '../util/quiker.js'
import config from '../config/config.js'
import databseService from '../service/databseService.js'
import httpError from '../util/httpError.js'
import responceseMessage from '../constent/responceseMessage.js'

export default async (req, _res, next) => {
    try {
        const { cookies, headers } = req
        let accessToken = cookies.accessToken

        // Check for Authorization header if cookie is missing
        if (!accessToken && headers.authorization) {
            const [scheme, token] = headers.authorization.split(' ')
            if (scheme === 'Bearer') {
                accessToken = token
            } else {
                accessToken = scheme // Fallback if no "Bearer" prefix
            }
        }

        if (accessToken) {
            try {
                const { userId } = quiker.verifyToken(accessToken, config.ACCESS_TOKEN.SECRET)
                const user = await databseService.findUserById(userId)
                if (user) {
                    req.authenticatedUser = user
                    return next()
                }
            } catch (verifyError) {
                // Return 401 for all JWT verification errors (expired, invalid, etc.)
                return httpError(next, verifyError, req, 401)
            }
        }

        httpError(next, new Error(responceseMessage.UNAUTHORIZED), req, 401)
    } catch (error) {
        httpError(next, error, req, 500)
    }
}
