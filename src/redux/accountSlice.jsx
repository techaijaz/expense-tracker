import { createSlice } from '@reduxjs/toolkit';
//import api from '@/utils/httpMethods'; // Adjust the import based on your project structure

// Async thunk to fetch accounts
// export const fetchAccounts = createAsyncThunk(
//   'accounts/fetchAccounts',
//   async () => {
//     const response = await api.get('/account/get');
//     return response.data; // Adjust based on your API response structure
//   }
// );

// export const addAccount = createAsyncThunk(
//   'accounts/addAccount',
//   async (accountData) => {
//     const response = await api.post('/account/create', accountData);
//     return response.data; // Adjust based on your API response structure
//   }
// );

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
      state.accounts.push(action.payload);
    },
    updateAccount: (state, action) => {
      const { id, updatedAccount } = action.payload;
      const index = state.accounts.findIndex((account) => account._id === id);
      if (index !== -1) {
        state.accounts[index] = updatedAccount;
      }
    },
  },
});

export const { getAccounts, setAccounts, addAccount, updateAccount } =
  accountsSlice.actions;
export default accountsSlice.reducer;
