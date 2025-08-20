import responceseMessage from '../constent/responceseMessage.js'
import httpError from '../util/httpError.js'

export const notFoundError = (req, res, next) => {
    try {
        throw new Error(responceseMessage.NOT_FOUND('Route'))
    } catch (error) {
        httpError(next, error, req, 500)
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (error, req, res, next) => {
    res.status(error.statusCode).json(error)
}
