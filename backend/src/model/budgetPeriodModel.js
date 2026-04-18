import mongoose from 'mongoose'

const budgetPeriodSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
        month: { type: Number, required: true }, // 1-12
        year: { type: Number, required: true },
        allocatedAmount: { type: Number, required: true },
        spentAmount: { type: Number, default: 0 },
        isAlertSent: { type: Boolean, default: false }, // 80% threshold flag
    },
    { timestamps: true }
)

export default mongoose.model('BudgetPeriod', budgetPeriodSchema)
