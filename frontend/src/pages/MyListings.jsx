import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, Package, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import SmartImage from '../components/SmartImage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import { firstImage, formatINR, formatDate } from '../utils/format';
import { STATUS_TONE } from '../constants';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'sold', label: 'Sold' },
  { key: 'removed', label: 'Removed' },
];

export default function MyListings() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({ total: 0, available: 0, sold: 0, removed: 0 });
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/products/my-listings')
      .then(({ data }) => {
        setProducts(data.data.products);
        setCounts(data.data.counts);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (product) => {
    setBusyId(product._id);
    const nextStatus = product.status === 'sold' ? 'available' : 'sold';
    try {
      const { data } = await api.patch(`/products/${product._id}/status`, { status: nextStatus });
      setProducts((current) =>
        current.map((entry) => (entry._id === product._id ? { ...entry, status: data.data.product.status } : entry))
      );
      setCounts((current) => {
        const updated = { ...current };
        updated[product.status] = Math.max(0, (updated[product.status] || 0) - 1);
        updated[nextStatus] = (updated[nextStatus] || 0) + 1;
        return updated;
      });
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const deleteListing = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${toDelete._id}`);
      toast.success('Listing deleted permanently.');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const visible = tab === 'all' ? products : products.filter((product) => product.status === tab);

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>My listings</h1>
            <p>Manage prices, mark items sold and keep your campus storefront tidy.</p>
          </div>
          <Link to="/sell" className="btn btn--primary">
            <Plus size={16} /> New listing
          </Link>
        </div>

        <div className="row row--between" style={{ marginBottom: 18 }}>
          <div className="tabs">
            {TABS.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={`tab ${tab === entry.key ? 'is-active' : ''}`}
                onClick={() => setTab(entry.key)}
              >
                {entry.label}
                <span className="tab__count">
                  {entry.key === 'all' ? counts.total : counts[entry.key] || 0}
                </span>
              </button>
            ))}
          </div>
          <span className="small muted">{products.length} listing{products.length === 1 ? '' : 's'} total</span>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading your listings…" />
        ) : error ? (
          <EmptyState
            icon={Package}
            title="Could not load your listings"
            description={error}
            action={
              <button type="button" className="btn btn--primary" onClick={load}>
                Retry
              </button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Package}
            title={products.length === 0 ? 'No listings yet' : `No ${tab} listings`}
            description={
              products.length === 0
                ? 'List your first item and start earning from things you no longer need.'
                : 'Switch tabs to see your other listings.'
            }
            action={
              <Link to="/sell" className="btn btn--primary">
                <Plus size={16} /> Sell an item
              </Link>
            }
          />
        ) : (
          <div className="panel">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Posted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product) => (
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
                      <td>
                        <strong>{formatINR(product.price)}</strong>
                      </td>
                      <td>
                        <span className={`badge badge--${STATUS_TONE[product.status] || 'slate'}`}>
                          {product.status}
                        </span>
                      </td>
                      <td>{product.views || 0}</td>
                      <td className="nowrap small muted">{formatDate(product.createdAt)}</td>
                      <td>
                        <div className="table__actions">
                          <Link to={`/products/${product._id}`} className="btn btn--outline btn--sm">
                            <Eye size={14} /> View
                          </Link>
                          <Link to={`/products/${product._id}/edit`} className="btn btn--soft btn--sm">
                            <Pencil size={14} /> Edit
                          </Link>
                          {product.status !== 'removed' && (
                            <button
                              type="button"
                              className="btn btn--outline btn--sm"
                              onClick={() => toggleStatus(product)}
                              disabled={busyId === product._id}
                            >
                              {product.status === 'sold' ? (
                                <>
                                  <RotateCcw size={14} /> Relist
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={14} /> Mark sold
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn--danger-soft btn--sm"
                            onClick={() => setToDelete(product)}
                          >
                            <Trash2 size={14} /> Delete
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
      </div>

      <ConfirmationModal
        open={Boolean(toDelete)}
        title="Delete this listing?"
        message={`“${toDelete?.title || ''}” and its images will be removed permanently. Wishlist saves and conversations linked to it are deleted too.`}
        confirmLabel="Delete listing"
        danger
        loading={deleting}
        onConfirm={deleteListing}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
