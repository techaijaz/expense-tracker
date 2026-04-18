import mongoose from 'mongoose'

const recurringSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, enum: ['INCOME', 'EXPENSE'], required: true },
        frequency: { 
            type: String, 
            enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'], 
            required: true 
        },
        startDate: { type: Date, required: true },
        nextDueDate: { type: Date, required: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
        toAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, // For transfers if we extend it
        status: { type: String, enum: ['ACTIVE', 'PAUSED'], default: 'ACTIVE' },
        entryType: { type: String, enum: ['auto', 'manual'], default: 'auto' },
        lastProcessedAt: { type: Date },
    },
    { timestamps: true }
)

export default mongoose.model('Recurring', recurringSchema)
