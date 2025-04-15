import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt, FaNetworkWired } from 'react-icons/fa';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check if we're on the login or register page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return null; // Don't show header on auth pages
  }

  return (
    <header className="bg-slate-800 border-b border-slate-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <FaNetworkWired className="h-6 w-6 text-indigo-400" />
              <span className="ml-2 text-white font-bold text-xl">RelNet</span>
            </Link>
            
            {user && (
              <nav className="ml-8 flex space-x-4">
                <Link 
                  to="/networks" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/networks') 
                      ? 'bg-slate-700 text-white' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  } transition-colors duration-200 flex items-center`}
                >
                  <FaNetworkWired className="mr-1" /> Networks
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-indigo-300 hidden md:block">
                  Hello, {user.username}
                </div>
                <div className="relative group">
                  <button className="flex text-slate-300 hover:text-white items-center focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                      <FaUser />
                    </div>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg py-1 z-10 border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/login"
                  className="text-slate-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;