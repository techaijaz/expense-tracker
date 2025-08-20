/* eslint-disable react/prop-types */
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { BsThreeDotsVertical } from 'react-icons/bs';
import AddAccounts from './AddAccounts';
import AccountOptDropdown from './AccountOptDropdown';

const AccountCard = ({
  icon,
  id,
  title,
  description,
  amount,
  accountNumber,
  iconBgColor = 'bg-green-100',
  iconTextColor = 'text-green-600',
  account,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="relative shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg w-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <div className="flex items-center space-x-4 relative">
        <div
          className={`p-3 rounded-full flex items-center justify-center ${iconBgColor} ${iconTextColor}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <CardHeader className="p-0 !flex !flex-row !justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </div>
            {/* Three dots icon */}
            <BsThreeDotsVertical
              className="cursor-pointer relative"
              onClick={() => setOpen((prev) => !prev)}
            />
            <AccountOptDropdown open={open} setOpen={setOpen} id={id} />
          </CardHeader>

          {/* Dropdown */}

          <CardDescription className="mt-4">
            <p className="text-sm">{accountNumber}</p>
            <p className="text-2xl font-bold mt-2">{amount}</p>
          </CardDescription>
          <CardFooter className="mt-4 p-0 flex justify-end space-x-2">
            <AddAccounts
              btnLabel="Edit Account"
              btnVariant="link"
              formData={account}
              isEdit
            />
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default AccountCard;
