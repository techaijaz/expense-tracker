import authSlice from './authSlice';
import { combineReducers } from '@reduxjs/toolkit';
import appSlice from './appSlice';
import accountSlice from './accountSlice';
import categorySlice from './categorySlice';
import transactionSlice from './transactionSlice';
import loanSlice from './loanSlice';
import dashboardSlice from './dashboardSlice';

const rootReducer = combineReducers({
  auth: authSlice,
  app: appSlice,
  accounts: accountSlice,
  category: categorySlice,
  transactions: transactionSlice,
  loans: loanSlice,
  dashboard: dashboardSlice,
});

export default rootReducer;
