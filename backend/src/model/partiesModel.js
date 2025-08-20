// path/to/models/Party.js
const mongoose = require('mongoose')

const partySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['payer', 'payee'],
            required: true,
        },
        contactInfo: {
            type: String, // Optional field for contact information
        },
    },
    {
        timestamps: true,
    }
)

// ... existing code for exporting the model ...
module.exports = mongoose.model('Party', partySchema)
