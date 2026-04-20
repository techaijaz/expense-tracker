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
            required: function () {
                return !this.googleId
            },
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
        },
        subscriptionPeriod: {
            type: String,
            default: null,
        },
        subscriptionStart: {
            type: Date,
            default: null,
        },
        subscriptionEnd: {
            type: Date,
            default: null,
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
        preferences: {
            _id: false,
            currency: {
                type: String,
                enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CNY'],
                default: 'INR',
            },
            dateFormat: {
                type: String,
                enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY'],
                default: 'DD/MM/YYYY',
            },
            decimalPlaces: {
                type: Number,
                default: 2,
                min: 0,
                max: 4,
            },
            fiscalYear: {
                type: String,
                enum: ['April-March', 'January-December'],
                default: 'April-March',
            },
            theme: {
                type: String,
                enum: ['dark', 'light', 'system'],
                default: 'dark',
            },
            accentColor: {
                type: String,
                enum: ['lightblue', 'tomato', 'orange', 'mint', 'brown', 'purple', 'green', 'pink'],
                default: 'lightblue',
            },
            language: {
                type: String,
                enum: ['en', 'hi'],
                default: 'en',
            },
            timezone: {
                type: String,
                default: 'Asia/Kolkata',
            },
            country: {
                type: String,
                default: 'IN',
            },
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
            default: null,
        },
        verificationTokenExpires: {
            type: Date,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
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
