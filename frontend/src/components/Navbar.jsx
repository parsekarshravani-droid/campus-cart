import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { CATEGORIES } from '../constants';
import Avatar from './Avatar.jsx';
import api from '../services/api';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { count } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let active = true;
    const loadUnread = () =>
      api
        .get('/messages/unread-count')
        .then(({ data }) => active && setUnread(data.data.unread))
        .catch(() => {});
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  useEffect(() => {
    const onClick = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('You have been signed out.');
      navigate('/');
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" aria-label="CAMPUS CART home">
          <span className="brand__mark">
            <ShoppingBag size={20} />
          </span>
          <span className="brand__text">
            CAMPUS<em>CART</em>
          </span>
        </Link>

        <nav className="navbar__links" aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/products">
            <Search size={15} /> Browse
          </NavLink>
          <div className="nav-dropdown">
            <button type="button" className="nav-dropdown__toggle">
              Categories <ChevronDown size={15} />
            </button>
            <div className="nav-dropdown__menu">
              {CATEGORIES.map(({ name, icon: Icon }) => (
                <Link
                  key={name}
                  to={`/products?category=${encodeURIComponent(name)}`}
                  className="nav-dropdown__item"
                >
                  <Icon size={16} /> {name}
                </Link>
              ))}
            </div>
          </div>
          <NavLink to="/sell">Sell an Item</NavLink>
        </nav>

        <div className="navbar__actions">
          <Link to="/wishlist" className="icon-btn" aria-label={`Wishlist (${count} items)`}>
            <Heart size={18} />
            {count > 0 && <span className="badge-count">{count}</span>}
          </Link>

          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button
                type="button"
                className="user-menu__toggle"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <Avatar user={user} size="xs" />
                <span className="user-menu__name">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} />
              </button>
              {menuOpen && (
                <div className="user-menu__panel" role="menu">
                  <div className="user-menu__head">
                    <Avatar user={user} size="sm" />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <Link to="/dashboard" className="user-menu__item" role="menuitem">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link to="/my-listings" className="user-menu__item" role="menuitem">
                    <Package size={16} /> My Listings
                  </Link>
                  <Link to="/messages" className="user-menu__item" role="menuitem">
                    <MessageSquare size={16} /> Messages
                    {unread > 0 && <span className="user-menu__count">{unread}</span>}
                  </Link>
                  <Link to="/wishlist" className="user-menu__item" role="menuitem">
                    <Heart size={16} /> Wishlist
                  </Link>
                  <Link to="/profile" className="user-menu__item" role="menuitem">
                    <Settings size={16} /> Profile settings
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="user-menu__divider" />
                      <Link to="/admin" className="user-menu__item" role="menuitem">
                        <Shield size={16} /> Admin console
                      </Link>
                    </>
                  )}
                  <div className="user-menu__divider" />
                  <button type="button" className="user-menu__item user-menu__item--danger" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            className="icon-btn navbar__burger"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className={`mobile-nav ${mobileOpen ? 'is-open' : ''}`}>
        <Link to="/" className="mobile-nav__link">
          <ShoppingBag size={17} /> Home
        </Link>
        <Link to="/products" className="mobile-nav__link">
          <Search size={17} /> Browse products
        </Link>
        <Link to="/sell" className="mobile-nav__link">
          <Plus size={17} /> Sell an item
        </Link>
        <Link to="/wishlist" className="mobile-nav__link">
          <Heart size={17} /> Wishlist {count > 0 ? `(${count})` : ''}
        </Link>
        {user && (
          <>
            <Link to="/dashboard" className="mobile-nav__link">
              <LayoutDashboard size={17} /> Dashboard
            </Link>
            <Link to="/my-listings" className="mobile-nav__link">
              <Package size={17} /> My listings
            </Link>
            <Link to="/messages" className="mobile-nav__link">
              <MessageSquare size={17} /> Messages {unread > 0 ? `(${unread})` : ''}
            </Link>
            <Link to="/profile" className="mobile-nav__link">
              <User size={17} /> Profile
            </Link>
            {isAdmin && (
              <Link to="/admin" className="mobile-nav__link">
                <Shield size={17} /> Admin console
              </Link>
            )}
          </>
        )}

        <p className="mobile-nav__title">Categories</p>
        {CATEGORIES.map(({ name, icon: Icon }) => (
          <Link key={name} to={`/products?category=${encodeURIComponent(name)}`} className="mobile-nav__link">
            <Icon size={17} /> {name}
          </Link>
        ))}

        <div className="mobile-nav__actions">
          {user ? (
            <button type="button" className="btn btn--outline btn--block" onClick={handleLogout}>
              <LogOut size={16} /> Log out
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn--outline btn--block">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--block">
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
