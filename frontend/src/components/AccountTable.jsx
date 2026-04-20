/* eslint-disable react/prop-types */
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableRow,
} from '@/components/ui/table';
import { BsBing } from 'react-icons/bs';
import { Link } from 'react-router-dom';

export function AccountTable({ accounts }) {
  console.log('Accounts:', accounts);

  return (
    <>
      <div className="flex justify-between">
        <h1 className="text-3xl">Accounts</h1>
        {accounts.length > 5 && (
          <Link to={'/accounts'}>View All your accounts</Link>
        )}
      </div>
      <Table className="table-auto w-full text-sm border-collapse border border-gray-300">
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableBody>
          {accounts &&
            accounts.slice(0, 5).map((account) => (
              <TableRow key={account.id}>
                <TableCell className="flex items-center">
                  <div className="flex items-center justify-center p-4 text-2xl">
                    <BsBing />
                  </div>
                  <div className="">
                    <div className="font-medium">{account.name}</div>
                    <div>{account.accountNumber}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <h3 className="text-2xl">{account.balance}</h3>
                  <p className="text-sm">account balance</p>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </>
  );
}
