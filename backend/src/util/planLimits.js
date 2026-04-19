/**
 * Subscription Plan Limits configuration and utility.
 */

export const PLAN_LIMITS = {
    basic: {
        accounts: {
            CASH: 1,
            OTHER: 1, // Any type other than CASH
        },
        budget: 1,
        recurring: 1,
        loans: {
            PERSONAL: 1,
            FORMAL: 1,
        },
        categories: 10,
        parties: 5,
        proFeatures: false,
    },
    pro: {
        accounts: 100,
        budget: 100,
        recurring: 100,
        loans: 100,
        categories: 100,
        parties: 100,
        proFeatures: true,
    },
};

/**
 * Check if the user has reached the limit for a specific model/feature.
 * @param {import('mongoose').Model} model - The Mongoose model to count documents for.
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} plan - The user's subscription plan ('basic' or 'pro').
 * @param {string} feature - The feature name (e.g., 'budget', 'recurring').
 * @param {object} [filter={}] - Optional filter to apply (e.g., { type: 'CASH' }).
 * @returns {Promise<{ allowed: boolean, limit: number, count: number }>}
 */
export const checkLimit = async (model, userId, plan, feature, filter = {}) => {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
    
    // If it's a pro features check and user is basic
    if (feature === 'proFeatures' && plan === 'basic') {
        return { allowed: false, limit: 0, count: 0 };
    }

    const count = await model.countDocuments({ userId, isDeleted: { $ne: true }, ...filter });
    let limit = limits;

    // Navigate nested limits if necessary
    if (typeof feature === 'string' && feature.includes('.')) {
        const parts = feature.split('.');
        for (const p of parts) {
            limit = limit[p];
        }
    } else {
        limit = limits[feature];
    }

    return {
        allowed: count < limit,
        limit,
        count,
    };
};
