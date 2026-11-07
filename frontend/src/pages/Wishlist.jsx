import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, PackageSearch, ShoppingBag, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Wishlist() {
  const { remove } = useWishlist();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/wishlist')
      .then(({ data }) => setItems(data.data.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const removeItem = async (productId) => {
    await remove(productId);
    setItems((current) => current.filter((item) => String(item.product?._id) !== String(productId)));
  };

  const clearAll = async () => {
    try {
      await Promise.all(items.map((item) => api.delete(`/wishlist/${item.product._id}`)));
      setItems([]);
      toast.success('Wishlist cleared.');
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error('Could not clear the wishlist.');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Your wishlist</h1>
            <p>
              {items.length
                ? `${items.length} saved item${items.length === 1 ? '' : 's'} waiting for you.`
                : 'Save listings you like and come back to them later.'}
            </p>
          </div>
          {items.length > 0 && (
            <button type="button" className="btn btn--outline" onClick={clearAll}>
              <Trash2 size={15} /> Clear wishlist
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner label="Loading your saved items…" />
        ) : error ? (
          <EmptyState
            icon={PackageSearch}
            title="Could not load your wishlist"
            description={error}
            action={
              <button type="button" className="btn btn--primary" onClick={load}>
                Try again
              </button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any listing to keep it here. Your wishlist is stored in your account, so it is there on every device."
            action={
              <>
                <Link to="/products" className="btn btn--primary">
                  <ShoppingBag size={16} /> Browse listings
                </Link>
                <Link to="/sell" className="btn btn--outline">
                  Sell something
                </Link>
              </>
            }
          />
        ) : (
          <div className="product-grid">
            {items.map((item) => (
              <div key={item._id} style={{ position: 'relative' }}>
                <ProductCard product={item.product} />
                <button
                  type="button"
                  className="btn btn--danger-soft btn--sm"
                  style={{ marginTop: 8, width: '100%' }}
                  onClick={() => removeItem(item.product._id)}
                >
                  <Trash2 size={14} /> Remove from wishlist
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
