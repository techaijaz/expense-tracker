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
            default: null,
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
        lastLoginAt: {
            type: Date,
            default: null,
        },
        plan: {
            type: String,
            default: 'basic',
            enum: ['basic', 'pro'],
        },
        trialStart: {
            type: Date,
            default: null,
        },
        trialEnd: {
            type: Date,
            default: null,
        },
        isTrialUsed: {
            type: Boolean,
            default: false,
        },
        onboardingDone: {
            type: Boolean,
            default: false,
        },
        googleId: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
)

userSchema.pre('save', function (next) {
    this._isNewUser = this.isNew
    next()
})


userSchema.post('save', async function (doc, next) {
    try {
        if (this._isNewUser) {
            // Logic moved to databaseService.setDefaultData to prevent duplication
        }
        next()
    } catch (error) {
        console.error('Error in userModel post-save hook:', error)
        next(error)
    }
})

export default mongoose.model('User', userSchema)
