import { Outlet } from 'react-router-dom';
import SideMenu from '../layouts/SideMenu';
import { useState } from 'react';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';

function MainLayout() {
  const [alignMenu] = useState(false);
  return (
    <div className="w-full h-full">
      {alignMenu ? <SideMenu /> : <Header />}
      <Outlet />
      <Footer />
    </div>
  );
}

export default MainLayout;
