import { createSlice } from '@reduxjs/toolkit';

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
  },
  reducers: {
    setAuthUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
    },
    updateAvatar: (state, action) => {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },
    updatePreferences: (state, action) => {
      if (state.user) {
        state.user.preferences = {
          ...(state.user.preferences || {}),
          ...action.payload,
        };
      }
    },
    updatePlan: (state, action) => {
      if (state.user) {
        state.user.plan = action.payload.plan;
        state.user.subscriptionPeriod = action.payload.subscriptionPeriod;
        state.user.subscriptionStart = action.payload.subscriptionStart;
        state.user.subscriptionEnd = action.payload.subscriptionEnd;
      }
    },
    setOnboardingDone: (state, action) => {
      if (state.user) {
        state.user.onboardingDone = action.payload;
      }
    },
  },
});

export const { setAuthUser, logout, updateAvatar, updatePreferences, setOnboardingDone, updatePlan } = authSlice.actions;
export default authSlice.reducer;
