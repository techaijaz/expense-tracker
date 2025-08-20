const mongoose = require('mongoose')

const loanSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        lender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Party',
            required: true,
        },
        borrower: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Party',
            required: true,
        },
        interestRate: {
            type: Number,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

// ... existing code for exporting the model ...
module.exports = mongoose.model('Loan', loanSchema)
