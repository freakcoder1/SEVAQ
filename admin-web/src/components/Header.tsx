import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-surface border-b border-surface-variant px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-on-surface">
          Welcome back, {user?.firstName || 'Admin'}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-on-surface-variant">{user?.email}</p>
          <p className="text-xs text-secondary-text capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary text-sm"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
