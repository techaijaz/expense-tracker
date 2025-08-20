import ShortLogo from '../layouts/ShortLogo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaMoon, FaCaretDown } from 'react-icons/fa';
import { FiLogOut, FiSun } from 'react-icons/fi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@/redux/appSlice';
import { useEffect, useState } from 'react';
import api from '@/utils/httpMethods';
import { logout } from '@/redux/authSlice';
import { toast } from 'sonner';
import { GiHamburgerMenu } from 'react-icons/gi';
import { MdClose } from 'react-icons/md';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.app);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false); // Close menu after navigation
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/user/logout', {});
      if (response?.success) {
        dispatch(logout());
        localStorage.clear();
        toast.success(response.message || 'Logged out successfully');
        navigate('/');
      } else {
        toast.error(
          response?.message || 'Failed to log out. Please try again.'
        );
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'An error occurred while logging out.'
      );
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <header className="flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-gray-900 shadow-md">
      {/* Logo */}
      <ShortLogo />

      {/* Hamburger Menu Icon */}
      <button
        className="md:hidden text-2xl"
        aria-label="Toggle menu"
        onClick={toggleMenu}
      >
        {isMenuOpen ? <MdClose /> : <GiHamburgerMenu />}
      </button>

      {/* Navigation Links */}
      <nav
        className={`absolute top-16 left-0 z-10 w-full bg-white dark:bg-gray-800 shadow-lg md:relative md:top-0 md:left-0 md:shadow-none md:w-auto md:flex md:items-center ${
          isMenuOpen ? 'block' : 'hidden'
        }`}
      >
        <ul className="flex flex-col items-start gap-4 p-4 md:flex-row md:gap-6 md:p-0">
          {['dashboard', 'transactions', 'accounts', 'settings'].map((item) => (
            <li key={item}>
              <NavLink
                to={`/${item}`}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-4 py-2 transition ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-green-500 hover:text-white'
                  }`
                }
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User & Theme Controls */}
      <div className="hidden md:flex items-center gap-6">
        {/* Theme Toggle */}
        <div onClick={() => dispatch(toggleTheme())} className="cursor-pointer">
          {theme === 'dark' ? (
            <FaMoon className="text-white text-2xl" />
          ) : (
            <FiSun className="text-black text-2xl" />
          )}
        </div>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <FaCaretDown className="text-gray-600 dark:text-gray-300" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate('/billing')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-between"
              onClick={(e) => handleLogout(e)}
            >
              Logout <FiLogOut />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
