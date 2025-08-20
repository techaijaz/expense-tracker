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
  },
});

export const { setCategories, addCatagory } = categorySlice.actions;
export default categorySlice.reducer;
