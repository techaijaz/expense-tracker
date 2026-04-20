import { createSlice } from '@reduxjs/toolkit';
import { startOfMonth, endOfMonth } from 'date-fns';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    dateRange: {
      from: startOfMonth(new Date()).toISOString(),
      to: endOfMonth(new Date()).toISOString(),
    },
  },
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = {
        from: action.payload.from || null,
        to: action.payload.to || null,
      };
    },
  },
});

export const { setDateRange } = dashboardSlice.actions;
export default dashboardSlice.reducer;
