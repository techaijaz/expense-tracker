import mongoose from 'mongoose'

const partiesSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        relation: {
            type: String,
            enum: ['FRIEND', 'FAMILY', 'VENDOR', 'CLIENT'],
            required: true,
        },
        netDebt: {
            type: Number,
            default: 0,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.__v
                delete ret.isDeleted
                return ret
            },
        },
    }
)

export default mongoose.model('Party', partiesSchema)
