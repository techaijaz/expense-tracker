import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import Category from '../model/categoryModel.js'
import { validateJoiSchema, validationCategoryBody } from '../service/validationService.js'

// Simple helper to generate a category tree
const buildCategoryTree = (categories, parentId = null) => {
    const parentStr = parentId ? parentId.toString() : null

    return categories
        .filter((c) => {
            const cParent = c.parentId ? c.parentId.toString() : null
            return cParent === parentStr
        })
        .map((c) => ({
            ...c.toObject(),
            children: buildCategoryTree(categories, c._id),
        }))
}

export default {
    createCategory: async (req, res, next) => {
        try {
            const { error, value } = validateJoiSchema(validationCategoryBody, req.body)
            if (error) return httpError(next, error, req, 422)

            const category = await Category.create({
                ...value,
                userId: req.authenticatedUser._id,
            })
            httpResponse(req, res, 201, 'Category created successfully', category)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    getAllCategories: async (req, res, next) => {
        try {
            const categories = await Category.find({
                userId: req.authenticatedUser._id,
                isDeleted: false,
            })
                .populate('parentId', 'name type')
                .sort({ createdAt: -1 })

            // Build tree structure
            const tree = buildCategoryTree(categories)

            httpResponse(req, res, 200, 'Categories retrieved successfully', {
                flat: categories,
                tree: tree,
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    updateCategory: async (req, res, next) => {
        try {
            const { name, type, parentId, icon } = req.body
            const updateFields = {}
            if (name !== undefined) updateFields.name = name
            if (type !== undefined) updateFields.type = type
            if (parentId !== undefined) updateFields.parentId = parentId
            if (icon !== undefined) updateFields.icon = icon

            const category = await Category.findOneAndUpdate(
                { _id: req.params.id, userId: req.authenticatedUser._id, isDeleted: false },
                { $set: updateFields },
                { new: true, runValidators: true }
            )
            if (!category) return httpError(next, 'Category not found', req, 404)
            httpResponse(req, res, 200, 'Category updated successfully', category)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
    deleteCategory: async (req, res, next) => {
        try {
            // Soft delete category
            const category = await Category.findOneAndUpdate(
                { _id: req.params.id, userId: req.authenticatedUser._id, isDeleted: false },
                { $set: { isDeleted: true } },
                { new: true }
            )
            if (!category) return httpError(next, 'Category not found', req, 404)

            // Note: you might also want to soft delete sub-categories here if needed.
            await Category.updateMany({ parentId: req.params.id, userId: req.authenticatedUser._id }, { $set: { isDeleted: true } })

            httpResponse(req, res, 200, 'Category soft-deleted successfully', category)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },
}
