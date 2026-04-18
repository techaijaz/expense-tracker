import mongoose from 'mongoose'

const budgetSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        amount: { type: Number, required: true },
        period: { type: String, enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'], default: 'Monthly' },
        alertThreshold: { type: Number, default: 80 },
        rollover: { type: Boolean, default: false },
        notes: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
)

export default mongoose.model('Budget', budgetSchema)
