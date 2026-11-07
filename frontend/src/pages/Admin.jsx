import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  LayoutDashboard,
  MessageSquare,
  Package,
  Search,
  Shield,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar.jsx';
import SmartImage from '../components/SmartImage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { firstImage, formatDate, formatINR } from '../utils/format';

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'products', label: 'Listings', icon: Package },
];

export default function Admin() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toRemove, setToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const loadStats = () =>
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data.data.stats))
      .catch((err) => toast.error(getErrorMessage(err)));

  const loadUsers = (search = '') =>
    api
      .get(`/admin/users?limit=50${search ? `&q=${encodeURIComponent(search)}` : ''}`)
      .then(({ data }) => setUsers(data.data.users))
      .catch((err) => toast.error(getErrorMessage(err)));

  const loadProducts = (search = '') =>
    api
      .get(`/admin/products?limit=50${search ? `&q=${encodeURIComponent(search)}` : ''}`)
      .then(({ data }) => setProducts(data.data.products))
      .catch((err) => toast.error(getErrorMessage(err)));

  useEffect(() => {
    setLoading(true);
    Promise.all([loadStats(), loadUsers(), loadProducts()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = (event) => {
    event.preventDefault();
    if (tab === 'users') loadUsers(query);
    if (tab === 'products') loadProducts(query);
  };

  const toggleSuspension = async (student) => {
    setBusyId(student._id);
    try {
      const { data } = await api.patch(`/admin/users/${student._id}/suspend`, {
        suspended: !student.isSuspended,
      });
      setUsers((current) =>
        current.map((entry) => (entry._id === student._id ? { ...entry, isSuspended: data.data.user.isSuspended } : entry))
      );
      toast.success(data.message);
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = async (product, status) => {
    setBusyId(product._id);
    try {
      const { data } = await api.patch(`/admin/products/${product._id}/status`, { status });
      setProducts((current) =>
        current.map((entry) => (entry._id === product._id ? { ...entry, status: data.data.product.status } : entry))
      );
      toast.success(data.message);
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const removeListing = async () => {
    setRemoving(true);
    try {
      await api.delete(`/admin/products/${toRemove._id}`);
      setProducts((current) => current.filter((entry) => entry._id !== toRemove._id));
      setToRemove(null);
      toast.success('Listing removed from the marketplace.');
      loadStats();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemoving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage label="Loading admin console…" />;

  const cards = stats
    ? [
        { label: 'Registered students', value: stats.totalUsers, icon: Users, tone: 'indigo' },
        { label: 'Total listings', value: stats.totalProducts, icon: Package, tone: 'violet' },
        { label: 'Available listings', value: stats.availableProducts, icon: CheckCircle2, tone: 'success' },
        { label: 'Sold listings', value: stats.soldProducts, icon: Wallet, tone: 'amber' },
        { label: 'Messages sent', value: stats.totalMessages, icon: MessageSquare, tone: 'indigo' },
        { label: 'Wishlist saves', value: stats.totalWishlist, icon: Shield, tone: 'violet' },
      ]
    : [];

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <span className="eyebrow">
              <Shield size={13} /> Admin console
            </span>
            <h1 style={{ marginTop: 10 }}>Marketplace moderation</h1>
            <p>Review students, keep listings clean and monitor campus activity.</p>
          </div>
          <Link to="/dashboard" className="btn btn--outline">
            <ArrowLeft size={15} /> My dashboard
          </Link>
        </div>

        <div className="tabs" style={{ marginBottom: 24, width: 'fit-content' }}>
          {TABS.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.key}
                type="button"
                className={`tab ${tab === entry.key ? 'is-active' : ''}`}
                onClick={() => {
                  setTab(entry.key);
                  setQuery('');
                  if (entry.key === 'users') loadUsers();
                  if (entry.key === 'products') loadProducts();
                }}
              >
                <Icon size={14} style={{ verticalAlign: '-2px', marginRight: 5 }} />
                {entry.label}
              </button>
            );
          })}
        </div>

        {(tab === 'overview' || tab === 'users') && stats?.suspendedUsers > 0 && tab === 'overview' && (
          <div className="note note--amber" style={{ marginBottom: 20 }}>
            <AlertTriangle size={16} />
            <span>{stats.suspendedUsers} suspended account(s). Suspended students cannot sign in or list items.</span>
          </div>
        )}

        {tab === 'overview' && (
          <>
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
            </div>

            <div className="dashboard-grid">
              <div className="panel">
                <div className="panel__head">
                  <h3>Newest listings</h3>
                  <button type="button" className="btn--link" onClick={() => setTab('products')}>
                    Manage listings
                  </button>
                </div>
                <div className="panel__body">
                  {products.slice(0, 5).map((product) => (
                    <div key={product._id} className="list-row">
                      <Link to={`/products/${product._id}`} className="list-row__thumb">
                        <SmartImage src={firstImage(product)} alt={product.title} />
                      </Link>
                      <div className="list-row__body">
                        <strong>{product.title}</strong>
                        <span>
                          {product.seller?.name} · {formatINR(product.price)} · {product.status}
                        </span>
                      </div>
                      <span className="badge badge--slate">{formatDate(product.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel__head">
                  <h3>Newest students</h3>
                  <button type="button" className="btn--link" onClick={() => setTab('users')}>
                    Manage users
                  </button>
                </div>
                <div className="panel__body">
                  {users.slice(0, 5).map((student) => (
                    <div key={student._id} className="list-row">
                      <Avatar user={student} size="sm" />
                      <div className="list-row__body">
                        <strong>{student.name}</strong>
                        <span>
                          {student.college} · {student.role}
                        </span>
                      </div>
                      {student.isSuspended ? (
                        <span className="badge badge--danger">Suspended</span>
                      ) : (
                        <span className="badge badge--success">Active</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <>
            <form className="row" onSubmit={search} style={{ marginBottom: 16 }}>
              <div className="input-group" style={{ flex: 1, maxWidth: 420 }}>
                <Search size={16} />
                <input
                  className="input"
                  placeholder="Search by name, email or college"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <button type="submit" className="btn btn--outline">
                Search
              </button>
            </form>

            <div className="panel">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>College</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <div className="table__product">
                            <Avatar user={student} size="xs" />
                            <div>
                              <strong>{student.name}</strong>
                              <span>{student.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="small">{student.college}</td>
                        <td>
                          <span className="badge badge--indigo">{student.role}</span>
                        </td>
                        <td className="small muted nowrap">{formatDate(student.createdAt)}</td>
                        <td>
                          {student.isSuspended ? (
                            <span className="badge badge--danger">Suspended</span>
                          ) : (
                            <span className="badge badge--success">Active</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`btn btn--sm ${student.isSuspended ? 'btn--soft' : 'btn--danger-soft'}`}
                            onClick={() => toggleSuspension(student)}
                            disabled={busyId === student._id || student._id === user?._id}
                          >
                            <Ban size={14} /> {student.isSuspended ? 'Reinstate' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && <div className="empty-block">No students matched your search.</div>}
            </div>
          </>
        )}

        {tab === 'products' && (
          <>
            <form className="row" onSubmit={search} style={{ marginBottom: 16 }}>
              <div className="input-group" style={{ flex: 1, maxWidth: 420 }}>
                <Search size={16} />
                <input
                  className="input"
                  placeholder="Search listings by title, category or college"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <button type="submit" className="btn btn--outline">
                Search
              </button>
            </form>

            {products.length === 0 ? (
              <EmptyState icon={Package} title="No listings found" description="Try a different search phrase." />
            ) : (
              <div className="panel">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Listing</th>
                        <th>Seller</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Posted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <div className="table__product">
                              <SmartImage src={firstImage(product)} alt={product.title} />
                              <div>
                                <strong>{product.title}</strong>
                                <span>{product.category}</span>
                              </div>
                            </div>
                          </td>
                          <td className="small">
                            {product.seller?.name}
                            <br />
                            <span className="muted">{product.seller?.email}</span>
                          </td>
                          <td>
                            <strong>{formatINR(product.price)}</strong>
                          </td>
                          <td>
                            <select
                              className="select"
                              style={{ padding: '6px 28px 6px 9px', fontSize: '0.76rem' }}
                              value={product.status}
                              onChange={(event) => changeStatus(product, event.target.value)}
                              disabled={busyId === product._id}
                              aria-label={`Status for ${product.title}`}
                            >
                              <option value="available">available</option>
                              <option value="sold">sold</option>
                              <option value="removed">removed</option>
                            </select>
                          </td>
                          <td className="small muted nowrap">{formatDate(product.createdAt)}</td>
                          <td>
                            <div className="table__actions">
                              <Link to={`/products/${product._id}`} className="btn btn--outline btn--sm">
                                View
                              </Link>
                              <button
                                type="button"
                                className="btn btn--danger-soft btn--sm"
                                onClick={() => setToRemove(product)}
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmationModal
        open={Boolean(toRemove)}
        title="Remove this listing?"
        message={`“${toRemove?.title || ''}” will be permanently deleted from the marketplace, along with its images and related conversations.`}
        confirmLabel="Remove listing"
        danger
        loading={removing}
        onConfirm={removeListing}
        onCancel={() => setToRemove(null)}
      />
    </div>
  );
}
