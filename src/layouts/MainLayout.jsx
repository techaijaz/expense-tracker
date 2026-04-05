import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SideMenu from './SideMenu';
import Header from './Header';
import TransactionPopup from '@/components/TransectionPopup';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);

  return (
    <div className="antialiased selection:bg-primary selection:text-on-primary font-body text-on-surface bg-background">
      {/* Responsive Sidebar */}
      <SideMenu isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Top Navigation Bar */}
      <Header
        onMenuToggle={() => setIsSidebarOpen(true)}
        onNewTransaction={() => setIsTransactionOpen(true)}
      />

      {/* Main Content Canvas */}
      <main className="ml-0 lg:ml-64 pt-16 min-h-screen bg-background text-on-surface flex flex-col">
        <Outlet
          context={{ openTransactionPopup: () => setIsTransactionOpen(true) }}
        />
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
