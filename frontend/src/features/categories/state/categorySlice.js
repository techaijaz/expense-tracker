import { createSlice } from '@reduxjs/toolkit';

const categorySlice = createSlice({
  name: 'category',
  initialState: {
    categories: {
      INCOME: [],
      EXPENSE: [],
      TRANSFER: [],
    },
  },
  reducers: {
    setCategories: (state, action) => {
      // action.payload should be the grouped object from backend
      state.categories = action.payload;
    },
    addCatagory: (state, action) => {
      const { type } = action.payload;
      if (state.categories[type]) {
        state.categories[type].unshift(action.payload);
      }
    },
    removeCategory: (state, action) => {
      const { _id, type } = action.payload;
      if (state.categories[type]) {
        state.categories[type] = state.categories[type].filter(
          (c) => c._id !== _id,
        );
      }
    },
    updateCategory: (state, action) => {
      const { _id, type } = action.payload;
      if (state.categories[type]) {
        const idx = state.categories[type].findIndex((c) => c._id === _id);
        if (idx !== -1) state.categories[type][idx] = action.payload;
      }
    },
  },
});

export const {
  setCategories,
  addCatagory,
  removeCategory,
  updateCategory,
} = categorySlice.actions;

// Selector for flat categories if needed by some components
export const selectFlatCategories = (state) => {
  const { INCOME, EXPENSE, TRANSFER } = state.category.categories;
  return [...(INCOME || []), ...(EXPENSE || []), ...(TRANSFER || [])];
};
export default categorySlice.reducer;
