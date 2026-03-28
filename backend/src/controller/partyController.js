import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Party from '../model/partiesModel.js'
import { validateJoiSchema, validationPartyBody } from '../service/validationService.js'

export default {
    createParty: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationPartyBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const party = await Party.create({
                ...value,
                userId: req.authenticatedUser._id,
            })
            httpResponse(req, res, 201, 'Party created successfully', party)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getAllParties: async (req, res, next) => {
        try {
            const parties = await Party.find({
                userId: req.authenticatedUser._id,
                isDeleted: false,
            }).sort({ createdAt: -1 })
            httpResponse(req, res, 200, 'Parties retrieved successfully', parties)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    updateParty: async (req, res, next) => {
        try {
            // Only update info, not netDebt manually
            const { name, relation } = req.body
            const updateFields = {}
            if (name !== undefined) updateFields.name = name
            if (relation !== undefined) updateFields.relation = relation

            const party = await Party.findOneAndUpdate(
                { _id: req.params.id, userId: req.authenticatedUser._id, isDeleted: false },
                { $set: updateFields },
                { new: true, runValidators: true }
            )
            if (!party) return httpError(next, 'Party not found', req, 404)
            httpResponse(req, res, 200, 'Party updated successfully', party)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    deleteParty: async (req, res, next) => {
        try {
            const party = await Party.findOneAndUpdate(
                { _id: req.params.id, userId: req.authenticatedUser._id, isDeleted: false },
                { $set: { isDeleted: true } },
                { new: true }
            )
            if (!party) return httpError(next, 'Party not found', req, 404)
            httpResponse(req, res, 200, 'Party soft-deleted successfully', party)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
