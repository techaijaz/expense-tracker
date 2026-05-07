import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from './SideMenu';
import Header from './Header';
import TransactionPopup from '@/features/transactions/components/TransactionPopup';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  return (
    <div className="app-layout h-screen overflow-hidden bg-bg">
      {/* Sidebar - Desktop relative, Mobile fixed */}
      <SideMenu isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <main className="main-content flex flex-col min-w-0">
        {/* Top Navbar */}
        <Header
          onMenuToggle={() => setIsSidebarOpen(true)}
          onNewTransaction={() => setIsTransactionOpen(true)}
        />

        {/* View Surface */}
        <div className="flex-1 overflow-y-auto relative outline-none">
          <div className="mx-auto w-full max-w-8xl">
            <Outlet
              context={{
                openTransactionPopup: () => setIsTransactionOpen(true),
              }}
            />
          </div>
        </div>
      </main>

      {/* Global Transaction Popup */}
      <TransactionPopup
        open={isTransactionOpen}
        setOpen={setIsTransactionOpen}
      />
    </div>
  );
}

export default MainLayout;
