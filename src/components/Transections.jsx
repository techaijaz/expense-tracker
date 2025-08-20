import { BiSolidFileExport } from 'react-icons/bi';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { useEffect, useState } from 'react';
import TransactionDialog from './TransectionPopup';
import useApi from '@/hooks/useApi';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { setTransections } from '@/redux/transectionSlice';
import { formatDate } from '@/utils/utils';
import { DateRangePicker } from './DateRangePicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

function Transections() {
  const dispatch = useDispatch();
  const { transections } = useSelector((state) => state.transections);

  const { data, error, makeRequest } = useApi();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    makeRequest({ url: 'transactions/all', method: 'get' });
  }, [makeRequest]);

  useEffect(() => {
    if (data) dispatch(setTransections(data?.transactions));
  }, [data, dispatch]);

  if (error) toast.error(error || '');

  const handleSuccess = () => setIsOpen(false);

  return (
    <div className="w-full px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-7xl mx-auto mt-10 border rounded-lg p-4 shadow-md">
        <h1 className="text-2xl md:text-4xl font-bold">Transaction Activity</h1>

        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <input
            type="search"
            placeholder="Search"
            className="border px-2 py-1 rounded-md"
          />
          <Select
            allowDeselection={true}
            closeOnSelect={false}
            defaultValue={'all'}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select transaction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="debt">Debt</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
          {/*<span className="hidden md:inline">From</span>
           <input type="date" className="border px-2 py-1 rounded-md" />
          <span className="hidden md:inline">To</span>
          <input type="date" className="border px-2 py-1 rounded-md" /> */}
          <DateRangePicker
            className={'w-[230px] justify-start text-left font-normal'}
          />
          <Button variant="primary" onClick={() => setIsOpen(true)}>
            Pay
          </Button>
          <TransactionDialog
            open={isOpen}
            setOpen={setIsOpen}
            onSuccess={handleSuccess}
          />
          <Button variant="primary" className="flex items-center gap-1">
            Export <BiSolidFileExport />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full max-w-7xl mx-auto mt-6 overflow-x-auto border rounded-lg shadow-md">
        <Table className="w-full text-sm border-collapse border border-gray-300">
          <TableCaption>A list of your recent transactions.</TableCaption>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="px-4 py-2">Date</TableHead>
              <TableHead className="px-4 py-2 text-right">Amount</TableHead>
              <TableHead className="px-4 py-2">Type</TableHead>
              <TableHead className="px-4 py-2 text-right">Category</TableHead>
              <TableHead className="px-4 py-2">Description</TableHead>
              <TableHead className="px-4 py-2 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transections &&
              transections?.map((transection) => (
                <TableRow key={transection._id} className="hover:bg-gray-50">
                  <TableCell className="px-4 py-2">
                    {formatDate(transection?.date || null)}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    {transection.amount || 'N/A'}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {transection?.type || 'N/A'}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right">
                    {transection.category?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {transection?.description || 'N/A'}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-right space-x-2">
                    <Button variant="outline">Edit</Button>
                    <Button variant="outline">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default Transections;
