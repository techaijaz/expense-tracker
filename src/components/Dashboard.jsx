import InfoCard from './InfoCard';
import { FaSackDollar } from 'react-icons/fa6';
import { FaDollarSign } from 'react-icons/fa';
import { FaRegMoneyBillAlt } from 'react-icons/fa';
import { Linechart } from './LineChart';
import { ResponsiveContainer } from 'recharts';
import Piechart from './Piechart';
import { InvoiceTable } from './InvoiceTable';
import { AccountTable } from './AccountTable';
//import { Button } from './ui/button';
// import ExpenseModal from './ExpenseModal';
import TransactionPopup from './TransectionPopup';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import { useSelector } from 'react-redux';

function Dashboard() {
  const { transections } = useSelector((state) => state.transections);
  const { accounts } = useSelector((state) => state.accounts);
  const [isOpen, setIsOpen] = useState(false);
  const { data, error, makeRequest } = useApi();
  useEffect(() => {
    makeRequest({ url: 'transactions/gettotals', method: 'get' });
  }, [makeRequest, transections.length]);

  if (error) {
    console.log(error);
  }
  const handleSuccess = () => {
    setIsOpen(false);
  };
  return (
    <div className="w-full p-4 md:p-8 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full mx-auto mt-5 p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-lg mt-2">Monitor your financial activities</p>
        </div>
        {/* <Button variant="primary">Pay</Button> */}
        {/* <ExpenseModal /> */}
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Pay
        </Button>
        <TransactionPopup
          open={isOpen}
          setOpen={setIsOpen}
          onSuccess={handleSuccess}
        />
      </div>

      {/* Info Cards */}
      <div className="flex flex-wrap gap-6 mt-6">
        <InfoCard
          icon={<FaSackDollar />}
          title={'Total Balance'}
          description={'Overall total balance'}
          amount={data?.totalBalance || 0}
        />
        <InfoCard
          icon={<FaRegMoneyBillAlt />}
          title={'Total Income'}
          description={'Overall total income'}
          amount={data?.totalsIncome || 0}
        />
        <InfoCard
          icon={<FaDollarSign />}
          title={'Total Expense'}
          description={'Overall total expense'}
          amount={data?.totalsExpense || 0}
        />
      </div>

      {/* Line Chart */}
      <div className="mt-6 p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <ResponsiveContainer width="100%">
          <Linechart />
        </ResponsiveContainer>
      </div>

      {/* Pie Charts */}
      <div className="flex flex-wrap gap-6 mt-6">
        <div className="w-full md:w-[32%] bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <ResponsiveContainer width="100%">
            <Piechart title="Account" />
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-[32%] bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <ResponsiveContainer width="100%">
            <Piechart title="Debts" />
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-[32%] bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <ResponsiveContainer width="100%">
            <Piechart title="Catagories" />
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables */}
      <div className="flex flex-wrap gap-6 mt-6">
        <div className="w-full md:w-[66%] p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <InvoiceTable transections={transections} />
        </div>
        <div className="w-full md:w-[32%] p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <AccountTable accounts={accounts} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
