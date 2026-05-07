import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    dateRange: {
      from: dayjs().startOf('month').toISOString(),
      to: dayjs().endOf('month').toISOString(),
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
