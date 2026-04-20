import { createSlice } from '@reduxjs/toolkit';

const transectionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    transections: [],
  },
  reducers: {
    setTransections: (state, action) => {
      state.transections = Array.isArray(action.payload) 
        ? action.payload.filter(Boolean) 
        : [];
    },
    addTransection: (state, action) => {
      if (!action.payload) return;
      const newTransactions = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      state.transections = [...newTransactions.filter(Boolean), ...state.transections].filter(Boolean);
    },
    updateTransection: (state, action) => {
      const updatedData = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      
      const updatedIds = updatedData.map(t => t._id);

      // Remove existing entries for these IDs
      state.transections = state.transections.filter(
        (t) => !updatedIds.includes(t._id)
      );

      // Add the updated ones
      state.transections = [...updatedData, ...state.transections];
    },
    deleteTransection: (state, action) => {
      // action.payload is the _id
      state.transections = state.transections.filter(
        (t) => t._id !== action.payload
      );
    },
  },
});

export const { setTransections, addTransection, updateTransection, deleteTransection } = transectionsSlice.actions;
export default transectionsSlice.reducer;

