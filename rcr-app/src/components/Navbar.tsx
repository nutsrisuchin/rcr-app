import { Link, useLocation } from 'react-router-dom';
import { Home, FilePlus, LayoutList } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const getNavClass = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <nav className="navbar hide-on-print">
      <div className="navbar-brand">
        <h1>GC RCR Portal</h1>
      </div>
      <div className="navbar-links">
        <Link to="/" className={getNavClass('/')}>
          <Home size={18} /> Dashboard
        </Link>
        <Link to="/forms/new" className={getNavClass('/forms/new')}>
          <FilePlus size={18} /> New Request
        </Link>
        <Link to="/forms" className={getNavClass('/forms')}>
          <LayoutList size={18} /> Manage Requests
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
