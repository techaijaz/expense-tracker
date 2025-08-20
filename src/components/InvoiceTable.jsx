/* eslint-disable react/prop-types */
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/utils/utils';
import { Link } from 'react-router-dom';

export function InvoiceTable({ transections }) {
  return (
    <div className="">
      <div className="flex justify-between">
        <h1 className="text-3xl">Latest transections</h1>
        <Link to={'/transactions'}>View All</Link>
      </div>
      <Table className="table-auto w-full text-sm border-collapse border border-gray-300">
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Category</TableHead>
            <TableHead className="text-right">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transections &&
            transections.map((transection) => (
              <TableRow key={transection.id}>
                <TableCell className="font-medium">
                  {formatDate(transection?.date || null)}
                </TableCell>
                <TableCell>{transection.amount || 'N/A'}</TableCell>
                <TableCell>{transection?.type || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  {transection.category?.name || 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  {transection?.description || 'N/A'}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
}
