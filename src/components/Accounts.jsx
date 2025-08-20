import { FaSackDollar } from 'react-icons/fa6';
//import { FaRegMoneyBillAlt } from 'react-icons/fa';
import AddAccounts from './AddAccounts';
import AccountCard from './AccountCard';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import useApi from '../hooks/useApi';
import { toast } from 'sonner';
import { getAccounts } from '@/redux/accountSlice';

function Accounts() {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);
  const { data, error, loading, makeRequest } = useApi();

  useEffect(() => {
    makeRequest({ url: 'account/get', method: 'get' });
  }, [makeRequest]);

  useEffect(() => {
    if (data) {
      dispatch(getAccounts(data));
    }
  }, [data, dispatch]);

  if (error) {
    toast.error(error || '');
  }
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen py-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-center w-[90vw] mx-auto border rounded-lg bg-white dark:bg-gray-800 shadow-md p-5">
        <div className="w-full lg:w-11/12 text-center lg:text-left">
          <h1 className="text-3xl lg:text-4xl font-bold">Accounts</h1>
          <p className="text-lg lg:text-xl mt-2 lg:mt-3">
            Monitor your all accounts in one place
          </p>
        </div>
        <div className="w-full lg:w-1/12 flex justify-center lg:justify-end mt-4 lg:mt-0">
          <AddAccounts />
        </div>
      </div>

      {/* Cards Section */}
      <div
        className={`grid grid-cols-1 ${
          accounts && accounts.length === 0
            ? ''
            : 'md:grid-cols-2 lg:grid-cols-4'
        } gap-4 w-[90vw] mx-auto my-6 px-5 py-5 border rounded-lg bg-white dark:bg-gray-800 shadow-md`}
      >
        {loading ? (
          <div>Loading...</div>
        ) : accounts && accounts.length > 0 ? (
          accounts.map((account, i) => (
            <AccountCard
              key={i}
              id={account._id}
              icon={<FaSackDollar />}
              title={account.name}
              description={account.type}
              amount={account.balance}
              accountNumber={account.accountNumber}
              account={account}
            />
          ))
        ) : (
          <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
            No accounts found
          </div>
        )}
      </div>

      {/* Add Money Popup */}
    </div>
  );
}

export default Accounts;
