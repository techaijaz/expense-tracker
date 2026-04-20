import userModel from '../model/userModel.js'
import paymentRequestModel from '../model/paymentRequestModel.js'
import globalSettingsModel from '../model/globalSettingsModel.js'
import httpResponse from '../util/httpResponse.js'
import httpError from '../util/httpError.js'
import dayjs from 'dayjs'

export default {
    getDashboardStats: async (req, res, next) => {
        try {
            const totalUsers = await userModel.countDocuments()
            const proUsers = await userModel.countDocuments({ plan: 'pro' })
            const basicUsers = await userModel.countDocuments({ plan: 'basic' })
            
            const revenueResult = await paymentRequestModel.aggregate([
                { $match: { status: 'verified' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0

            const usersByCountry = await userModel.aggregate([
                { $group: { _id: '$preferences.country', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])

            const activePayments = await paymentRequestModel.countDocuments({ status: 'pending' })

            // Registration trend (last 7 days)
            const sevenDaysAgo = dayjs().subtract(7, 'days').toDate()
            const registrationTrend = await userModel.aggregate([
                { $match: { createdAt: { $gte: sevenDaysAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])

            httpResponse(req, res, 200, 'Admin stats retrieved', {
                totalUsers,
                proUsers,
                basicUsers,
                totalRevenue,
                activePayments,
                usersByCountry,
                registrationTrend
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getUsers: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, search = '' } = req.query
            const query = search ? {
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ]
            } : {}

            const users = await userModel.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .select('-password -refreshToken')

            const count = await userModel.countDocuments(query)

            httpResponse(req, res, 200, 'Users retrieved', {
                users,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalUsers: count
            })
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getGlobalSettings: async (req, res, next) => {
        try {
            let settings = await globalSettingsModel.findOne()
            if (!settings) {
                settings = await globalSettingsModel.create({
                    activePaymentGateway: 'manual',
                    manualPaymentInfo: { instructions: 'Please transfer to account X and upload receipt.' }
                })
            }
            httpResponse(req, res, 200, 'Settings retrieved', settings)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    updateGlobalSettings: async (req, res, next) => {
        try {
            const { activePaymentGateway, manualPaymentInfo } = req.body
            const settings = await globalSettingsModel.findOneAndUpdate(
                {},
                { activePaymentGateway, manualPaymentInfo, updatedBy: req.authenticatedUser._id },
                { upsert: true, new: true }
            )
            httpResponse(req, res, 200, 'Settings updated', settings)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    getPendingPayments: async (req, res, next) => {
        try {
            const payments = await paymentRequestModel.find({ status: 'pending' })
                .populate('userId', 'email firstName lastName')
                .sort({ createdAt: -1 })
            httpResponse(req, res, 200, 'Pending payments retrieved', payments)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    },

    verifyPayment: async (req, res, next) => {
        try {
            const { paymentId, status, rejectionReason } = req.body
            if (!['verified', 'rejected'].includes(status)) {
                return httpError(next, new Error('Invalid status'), req, 400)
            }

            const payment = await paymentRequestModel.findById(paymentId)
            if (!payment) return httpError(next, new Error('Payment request not found'), req, 404)

            payment.status = status
            payment.verifiedBy = req.authenticatedUser._id
            payment.verifiedAt = new Date()
            if (rejectionReason) payment.rejectionReason = rejectionReason
            await payment.save()

            if (status === 'verified') {
                // Activate subscription
                const user = await userModel.findById(payment.userId)
                user.plan = 'pro'
                user.subscriptionPeriod = payment.period
                user.subscriptionStart = new Date()
                user.subscriptionEnd = payment.period === 'monthly' ? dayjs().add(1, 'month').toDate() : dayjs().add(1, 'year').toDate()
                await user.save()
            }

            httpResponse(req, res, 200, `Payment ${status} successfully`, payment)
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}
