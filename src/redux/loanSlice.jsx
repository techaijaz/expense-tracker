import { createSlice } from '@reduxjs/toolkit';

const loanSlice = createSlice({
  name: 'loans',
  initialState: {
    loans: [],
  },
  reducers: {
    setLoans: (state, action) => {
      state.loans = action.payload;
    },
    addLoan: (state, action) => {
      state.loans.unshift(action.payload);
    },
    updateLoan: (state, action) => {
      const index = state.loans.findIndex((l) => l._id === action.payload._id);
      if (index !== -1) state.loans[index] = action.payload;
    },
    removeLoan: (state, action) => {
      state.loans = state.loans.filter((l) => l._id !== action.payload);
    },
  },
});

export const { setLoans, addLoan, updateLoan, removeLoan } = loanSlice.actions;
export default loanSlice.reducer;
