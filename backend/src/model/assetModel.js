import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ['GOLD', 'SILVER', 'VEHICLE', 'REAL_ESTATE', 'OTHER'],
            required: true,
        },
        currentValue: { type: Number, required: true },
        initialValue: { type: Number, default: 0 },
        acquiredAt: { type: Date, default: Date.now },
        description: { type: String },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
)

export default mongoose.model('Asset', assetSchema)

