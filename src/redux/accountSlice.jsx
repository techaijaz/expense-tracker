import { createSlice } from '@reduxjs/toolkit';

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    accounts: [],
  },
  reducers: {
    getAccounts: (state, action) => {
      state.accounts = action.payload;
    },
    setAccounts: (state, action) => {
      state.accounts = action.payload;
    },
    addAccount: (state, action) => {
      // If the new account is default, clear default from others
      if (action.payload.isDefault) {
        state.accounts.forEach(a => { a.isDefault = false; });
      }
      state.accounts.unshift(action.payload);
    },
    updateAccount: (state, action) => {
      const updated = action.payload;
      // If updated account is now default, clear default from all others
      if (updated.isDefault) {
        state.accounts.forEach(a => { a.isDefault = false; });
      }
      const index = state.accounts.findIndex(a => a._id === updated._id);
      if (index !== -1) {
        state.accounts[index] = updated;
      }
    },
    removeAccount: (state, action) => {
      // action.payload = account _id
      state.accounts = state.accounts.filter(a => a._id !== action.payload);
    },
  },
});

export const { getAccounts, setAccounts, addAccount, updateAccount, removeAccount } =
  accountsSlice.actions;
export default accountsSlice.reducer;
