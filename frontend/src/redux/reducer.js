import authSlice from '@/features/auth/state/authSlice';
import { combineReducers } from '@reduxjs/toolkit';
import appSlice from './appSlice';
import accountSlice from '@/features/accounts/state/accountSlice';
import categorySlice from '@/features/categories/state/categorySlice';
import transactionSlice from '@/features/transactions/state/transactionSlice';
import loanSlice from '@/features/loans/state/loanSlice';
import dashboardSlice from '@/features/dashboard/state/dashboardSlice';

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
