import mongoose, { Schema } from 'mongoose'

const globalSettingsSchema = new Schema(
    {
        activePaymentGateway: {
            type: String,
            enum: ['stripe', 'razorpay', 'manual'],
            default: 'manual',
        },
        manualPaymentInfo: {
            bankName: String,
            accountNumber: String,
            ifsc: String,
            upiId: String,
            instructions: String,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('GlobalSettings', globalSettingsSchema)
