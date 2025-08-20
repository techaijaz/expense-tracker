import quiker from '../util/quiker.js'
import config from '../config/config.js'
import databseService from '../service/databseService.js'
import httpError from '../util/httpError.js'
import responceseMessage from '../constent/responceseMessage.js'

export default async (req, _res, next) => {
    try {
        const { cookies } = req
        const { accessToken } = cookies
        if (accessToken) {
            const { userId } = quiker.verifyToken(accessToken, config.ACCESS_TOKEN.SECRET)

            const user = await databseService.findUserById(userId)
            if (user) {
                req.authenticatedUser = user
                return next()
            }
        }
        httpError(next, new Error(responceseMessage.UNAUTHORIZED), req, 401)
    } catch (error) {
        if (error.message === 'jwt expired') {
            return httpError(next, error, req, 401)
        }
        httpError(next, error, req, 500)
    }
}
