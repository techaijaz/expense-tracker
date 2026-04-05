import authSlice from './authSlice';
import { combineReducers } from '@reduxjs/toolkit';
import appSlice from './appSlice';
import accountSlice from './accountSlice';
import categorySlice from './categorySlice';
import transectionSlice from './transectionSlice';
import loanSlice from './loanSlice';

const rootReducer = combineReducers({
  auth: authSlice,
  app: appSlice,
  accounts: accountSlice,
  category: categorySlice,
  transections: transectionSlice,
  loans: loanSlice,
});

export default rootReducer;
