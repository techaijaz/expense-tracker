const mongoose = require('mongoose')

const assetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['Property', 'Vehicle', 'Other'],
        required: true,
    },
    acquiredAt: {
        type: Date,
        default: Date.now,
    },
})

// ... existing code for exporting the model ...
module.exports = mongoose.model('Asset', assetSchema)
