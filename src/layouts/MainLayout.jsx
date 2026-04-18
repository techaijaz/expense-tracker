import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from './SideMenu';
import Header from './Header';
import TransactionPopup from '@/components/TransectionPopup';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  return (
    <div className="app-layout h-screen overflow-hidden">
      {/* Premium Sidebar */}
      <SideMenu isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="main-content flex flex-col">
        {/* Top Navbar */}
        <Header
          onMenuToggle={() => setIsSidebarOpen(true)}
          onNewTransaction={() => setIsTransactionOpen(true)}
        />

        {/* View Surface */}
        <div className="flex-1 overflow-y-auto">
          <Outlet
            context={{ openTransactionPopup: () => setIsTransactionOpen(true) }}
          />
        </div>
      </div>

      {/* Global Transaction Popup */}
      <TransactionPopup
        open={isTransactionOpen}
        setOpen={setIsTransactionOpen}
      />
    </div>
  );
}

export default MainLayout;
