import mongoose, { Schema } from 'mongoose'

const userSchema = new Schema(
    {
        firstName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        lastName: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        avatar: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        consent: {
            type: Boolean,
            required: true,
            default: false,
        },
        refreshToken: {
            _id: false,
            token: {
                type: String,
                default: null,
            },
        },
        setBasicDetails: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('User', userSchema)
