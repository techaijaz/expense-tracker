const mongoose = require('mongoose')

const businessSchema = new mongoose.Schema({
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
        enum: ['Accessories', 'Sharemarket', 'Other'],
        required: true,
    },
    investment: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

// ... existing code for exporting the model ...
module.exports = mongoose.model('Business', businessSchema)
