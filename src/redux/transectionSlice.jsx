import { createSlice } from '@reduxjs/toolkit';

const transectionsSlice = createSlice({
  name: 'accounts',
  initialState: {
    transections: [],
  },
  reducers: {
    setTransections: (state, action) => {
      state.transections = action.payload;
    },
    addTransection: (state, action) => {
      state.transections = [action.payload, ...state.transections];
    },
  },
});

export const { setTransections, addTransection } = transectionsSlice.actions;
export default transectionsSlice.reducer;
