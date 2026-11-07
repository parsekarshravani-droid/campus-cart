import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Heart,
  MessageSquare,
  Package,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Eye,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar.jsx';
import SmartImage from '../components/SmartImage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { firstImage, formatINR, timeAgo } from '../utils/format';
import { STATUS_TONE } from '../constants';

export default function Dashboard() {
  const { user, emailVerification } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/users/dashboard')
      .then(({ data: res }) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resendVerification = async () => {
    setResending(true);
    try {
      const { data: res } = await api.post('/auth/resend-verification');
      if (res.data?.sent) toast.success(res.message);
      else toast.info(res.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage label="Loading your dashboard…" />;

  if (error || !data) {
    return (
      <div className="page container">
        <EmptyState
          icon={ShieldAlert}
          title="Could not load your dashboard"
          description={error || 'Please try again.'}
          action={
            <button type="button" className="btn btn--primary" onClick={load}>
              Retry
            </button>
          }
        />
      </div>
    );
  }

  const { stats, recentListings, recentInquiries } = data;
  const cards = [
    { label: 'Total listings', value: stats.totalListings, icon: Package, tone: 'indigo' },
    { label: 'Active listings', value: stats.activeListings, icon: Tag, tone: 'success' },
    { label: 'Sold items', value: stats.soldListings, icon: CheckCircle2, tone: 'violet' },
    { label: 'Wishlist items', value: stats.wishlistCount, icon: Heart, tone: 'danger' },
    { label: 'Inquiries received', value: stats.inquiriesReceived, icon: MessageSquare, tone: 'amber' },
  ];

  return (
    <div className="page">
      <div className="container">
        {!user?.isVerified && emailVerification.required && (
          <div className="verify-banner">
            <ShieldAlert size={18} />
            <span>
              Your college email is not verified yet. Verify it to build trust with buyers and sellers.
            </span>
            <button type="button" className="btn btn--outline btn--sm" onClick={resendVerification} disabled={resending}>
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
          </div>
        )}

        <div className="page-head">
          <div className="profile-head">
            <Avatar user={user} size="lg" />
            <div>
              <h1>Hi, {user?.name?.split(' ')[0]}</h1>
              <p>
                {user?.department} · {user?.year} · {user?.college}
                {user?.isVerified && (
                  <span className="badge badge--indigo" style={{ marginLeft: 8 }}>
                    <BadgeCheck size={12} /> Verified
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="page-head__actions">
            <Link to="/sell" className="btn btn--primary">
              <Plus size={16} /> New listing
            </Link>
            <Link to="/products" className="btn btn--outline">
              Browse marketplace
            </Link>
          </div>
        </div>

        <div className="stat-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`stat-card stat-card--${card.tone}`}>
                <span className="stat-card__icon">
                  <Icon size={19} />
                </span>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </div>
            );
          })}
          <div className="stat-card">
            <span className="stat-card__icon">
              <Eye size={19} />
            </span>
            <strong>{stats.totalViews}</strong>
            <span>Listing views</span>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="stack">
            <section className="panel">
              <div className="panel__head">
                <h3>Your recent listings</h3>
                <Link to="/my-listings" className="btn--link">
                  Manage all <ArrowRight size={13} style={{ verticalAlign: '-2px' }} />
                </Link>
              </div>
              <div className="panel__body">
                {recentListings.length === 0 ? (
                  <EmptyState
                    icon={ShoppingBag}
                    title="You have not listed anything yet"
                    description="Sell your first textbook, calculator or hostel item — it takes about a minute."
                    action={
                      <Link to="/sell" className="btn btn--primary btn--sm">
                        <Plus size={15} /> Sell an item
                      </Link>
                    }
                  />
                ) : (
                  recentListings.map((product) => (
                    <div key={product._id} className="list-row">
                      <Link to={`/products/${product._id}`} className="list-row__thumb">
                        <SmartImage src={firstImage(product)} alt={product.title} />
                      </Link>
                      <div className="list-row__body">
                        <strong>{product.title}</strong>
                        <span>
                          {formatINR(product.price)} · {product.views || 0} views · {timeAgo(product.createdAt)}
                        </span>
                      </div>
                      <span className={`badge badge--${STATUS_TONE[product.status] || 'slate'}`}>
                        {product.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel__head">
                <h3>Recent inquiries</h3>
                <Link to="/messages" className="btn--link">
                  Open inbox <ArrowRight size={13} style={{ verticalAlign: '-2px' }} />
                </Link>
              </div>
              <div className="panel__body">
                {recentInquiries.length === 0 ? (
                  <p className="muted small" style={{ margin: 0 }}>
                    No buyer messages yet. Share your listing with classmates to get your first inquiry.
                  </p>
                ) : (
                  recentInquiries.map((message) => (
                    <div key={message._id} className="list-row">
                      <Avatar user={message.sender} size="sm" />
                      <div className="list-row__body">
                        <strong>
                          {message.sender?.name} · {message.product?.title || 'Listing'}
                        </strong>
                        <span>{message.message}</span>
                      </div>
                      <Link
                        to={`/messages/${message.sender?._id}?product=${message.product?._id}`}
                        className={`btn btn--sm ${message.read ? 'btn--outline' : 'btn--primary'}`}
                      >
                        {message.read ? 'View' : 'Reply'}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <aside className="stack">
            <section className="panel">
              <div className="panel__head">
                <h3>Quick actions</h3>
              </div>
              <div className="panel__body">
                <div className="quick-actions">
                  <Link to="/sell" className="quick-action">
                    <Plus size={18} /> Sell an item
                  </Link>
                  <Link to="/my-listings" className="quick-action">
                    <Package size={18} /> My listings
                  </Link>
                  <Link to="/messages" className="quick-action">
                    <MessageSquare size={18} /> Messages
                    {stats.unreadMessages > 0 && <span className="badge badge--danger">{stats.unreadMessages} new</span>}
                  </Link>
                  <Link to="/wishlist" className="quick-action">
                    <Heart size={18} /> Wishlist
                  </Link>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel__head">
                <h3>Seller profile</h3>
                <Link to="/profile" className="btn--link">
                  Edit
                </Link>
              </div>
              <div className="panel__body">
                <div className="row" style={{ marginBottom: 12 }}>
                  <Avatar user={user} size="md" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{user?.name}</strong>
                    <span className="small muted">{user?.email}</span>
                  </div>
                </div>
                <p className="small muted" style={{ marginBottom: 0 }}>
                  A complete profile with your department and year helps buyers trust you. Your email and phone stay
                  private.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
