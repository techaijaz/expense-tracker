/* eslint-disable react/prop-types */
import { useState } from 'react';
import AddMoneyPopup from './AddMoneyPopup';

import { BiTransfer } from 'react-icons/bi';
import FundTransfer from './FundTransfer';

function AccountOptDropdown({ open, id }) {
  const [aMOpen, setAmOpen] = useState(false);
  const [fTOpen, setFtOpen] = useState(false);
  return (
    <>
      <div
        className={`${
          open ? 'block' : 'hidden'
        } absolute left-[3.5rem] top-[1.5rem] z-50`}
      >
        <div className="absolute z-10 mt-2 w-48 origin-top-right rounded-xl bg-card border border-secondary-container py-1 shadow-xl ring-1 ring-black/5 focus:outline-none">
          <div onClick={() => setFtOpen(true)} className="cursor-pointer p-3 text-sm text-on-surface hover:bg-surface-variant transition-colors flex items-center">
            <BiTransfer className="mr-2 text-lg text-on-surface-variant" />
            Transfer Fund
          </div>
          <div onClick={() => setAmOpen(true)} className="cursor-pointer p-3 text-sm text-on-surface hover:bg-surface-variant transition-colors flex items-center">
            <BiTransfer className="mr-2 text-lg text-on-surface-variant" />
            Add Amount
          </div>
        </div>
      </div>
      <AddMoneyPopup open={aMOpen} setOpen={setAmOpen} accountId={id} />
      <FundTransfer open={fTOpen} setOpen={setFtOpen} fromAccountId={id} />
    </>
  );
}

export default AccountOptDropdown;
