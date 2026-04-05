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
      if (state.user?.user) {
        state.user.user.avatar = action.payload;
      }
    },
    updatePreferences: (state, action) => {
      if (state.user?.user) {
        state.user.user.preferences = {
          ...(state.user.user.preferences || {}),
          ...action.payload,
        };
      }
    },
  },
});

export const { setAuthUser, logout, updateAvatar, updatePreferences } = authSlice.actions;
export default authSlice.reducer;
