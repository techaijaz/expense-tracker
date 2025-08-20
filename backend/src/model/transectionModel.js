import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['expense', 'income', 'transfer', 'loan'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        description: {
            type: String,
            required: true,
        },
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Account',
            required: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        party: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Party', // Reference to the party involved in the transaction
        },
        loan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Loan', // Reference to the loan if applicable
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('Transaction', transactionSchema)
