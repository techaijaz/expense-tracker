import mongoose from 'mongoose'

const loanSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
        accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
        amount: { type: Number, required: true },

        // Sirf ye batayega ki udhaar liya hai ya diya hai
        type: {
            type: String,
            enum: ['BORROWED', 'LENT'],
            required: true,
        },
        date: { type: Date, default: Date.now },
        transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
        isDeleted: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ['PENDING', 'PAID'],
            default: 'PENDING',
        },
        dueDate: { type: Date },
        interestRate: { type: Number, default: 0 },
    },
    { timestamps: true }
)

export default mongoose.model('Loan', loanSchema)
