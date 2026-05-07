import { createSlice } from '@reduxjs/toolkit';

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
  },
  reducers: {
    setTransactions: (state, action) => {
      state.transactions = Array.isArray(action.payload) 
        ? action.payload.filter(Boolean) 
        : [];
    },
    addTransaction: (state, action) => {
      if (!action.payload) return;
      const newTransactions = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      state.transactions = [...newTransactions.filter(Boolean), ...state.transactions].filter(Boolean);
    },
    updateTransaction: (state, action) => {
      const updatedData = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      
      const updatedIds = updatedData.map(t => t._id);

      // Remove existing entries for these IDs
      state.transactions = state.transactions.filter(
        (t) => !updatedIds.includes(t._id)
      );

      // Add the updated ones
      state.transactions = [...updatedData, ...state.transactions];
    },
    deleteTransaction: (state, action) => {
      // action.payload is the _id
      state.transactions = state.transactions.filter(
        (t) => t._id !== action.payload
      );
    },
  },
});

export const { setTransactions, addTransaction, updateTransaction, deleteTransaction } = transactionsSlice.actions;
export default transactionsSlice.reducer;

