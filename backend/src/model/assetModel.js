import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        type: { 
            type: String, 
            enum: ['CASH', 'BANK', 'INVESTMENT', 'REAL_ESTATE', 'VEHICLE', 'GOLD', 'OTHER'], 
            required: true 
        },
        currentValue: { type: Number, required: true },
        acquiredAt: { type: Date, default: Date.now },
        description: { type: String },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
)

export default mongoose.model('Asset', assetSchema)
