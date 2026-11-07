import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [ids, setIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWishlist = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/wishlist');
      setIds(new Set(data.data.productIds.map(String)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const toggle = useCallback(
    async (productId) => {
      const id = String(productId);
      if (!user) {
        toast.info('Sign in to save items to your wishlist.');
        return { needsAuth: true };
      }

      const wasSaved = ids.has(id);
      setIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        if (wasSaved) {
          await api.delete(`/wishlist/${id}`);
          toast.success('Removed from your wishlist.');
        } else {
          await api.post(`/wishlist/${id}`);
          toast.success('Saved to your wishlist.');
        }
        return { saved: !wasSaved };
      } catch (err) {
        setIds((current) => {
          const next = new Set(current);
          if (wasSaved) next.add(id);
          else next.delete(id);
          return next;
        });
        toast.error(getErrorMessage(err));
        return { error: err };
      }
    },
    [ids, user, toast]
  );

  const remove = useCallback(
    async (productId) => {
      const id = String(productId);
      setIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      try {
        await api.delete(`/wishlist/${id}`);
        toast.success('Removed from your wishlist.');
      } catch (err) {
        setIds((current) => new Set(current).add(id));
        toast.error(getErrorMessage(err));
      }
    },
    [toast]
  );

  const value = useMemo(
    () => ({
      ids,
      count: ids.size,
      loading,
      error,
      isSaved: (productId) => ids.has(String(productId)),
      toggle,
      remove,
      reload: loadWishlist,
    }),
    [ids, loading, error, toggle, remove, loadWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used inside a WishlistProvider');
  return context;
}
