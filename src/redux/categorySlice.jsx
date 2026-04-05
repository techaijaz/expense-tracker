import { createSlice } from '@reduxjs/toolkit';

export const categorySlice = createSlice({
  name: 'category',
  initialState: {
    categories: [],
  },
  reducers: {
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    addCatagory: (state, action) => {
      state.categories.push(action.payload);
    },
    removeCategory: (state, action) => {
      state.categories = state.categories.filter((c) => c._id !== action.payload);
    },
    updateCategory: (state, action) => {
      const idx = state.categories.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) state.categories[idx] = action.payload;
    },
  },
});

export const { setCategories, addCatagory, removeCategory, updateCategory } = categorySlice.actions;
export default categorySlice.reducer;
