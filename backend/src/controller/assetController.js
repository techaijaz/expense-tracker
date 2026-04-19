import assetModel from '../model/assetModel.js'
import httpError from '../util/httpError.js'
import httpResponse from '../util/httpResponse.js'

export default {
    createAsset: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { name, type, currentValue, initialValue, acquiredAt, description } = req.body

            const asset = await assetModel.create({
                userId,
                name,
                type,
                currentValue,
                initialValue: initialValue || currentValue,
                acquiredAt,
                description
            })

            httpResponse(req, res, 201, 'Asset created successfully', asset)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getAssets: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const assets = await assetModel.find({ userId, isDeleted: false }).sort({ createdAt: -1 })
            httpResponse(req, res, 200, 'Assets retrieved successfully', assets)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateAsset: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { id } = req.params
            const updateData = req.body

            const asset = await assetModel.findOneAndUpdate(
                { _id: id, userId, isDeleted: false },
                { $set: updateData },
                { new: true }
            )

            if (!asset) {
                return httpResponse(req, res, 404, 'Asset not found')
            }

            httpResponse(req, res, 200, 'Asset updated successfully', asset)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    deleteAsset: async (req, res, next) => {
        try {
            const userId = req.authenticatedUser._id
            const { id } = req.params

            const asset = await assetModel.findOneAndUpdate(
                { _id: id, userId, isDeleted: false },
                { $set: { isDeleted: true } },
                { new: true }
            )

            if (!asset) {
                return httpResponse(req, res, 404, 'Asset not found')
            }

            httpResponse(req, res, 200, 'Asset deleted successfully')
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
