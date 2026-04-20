import mongoose, { Schema } from 'mongoose'

const paymentRequestSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        plan: {
            type: String,
            required: true,
        },
        period: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        transactionId: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
        },
        evidence: {
            type: String, // URL or description of proof
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        verifiedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('PaymentRequest', paymentRequestSchema)
