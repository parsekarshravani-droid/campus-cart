import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProductForm from '../components/ProductForm.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import api, { getErrorMessage } from '../services/api';

export default function EditProduct() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        if (active) setProduct(data.data.product);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <LoadingSpinner fullPage label="Loading listing…" />;

  if (error || !product) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>Listing not found</h3>
          <p>{error || 'This listing may have been deleted.'}</p>
          <Link to="/my-listings" className="btn btn--primary">
            Back to my listings
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = String(product.seller?._id) === String(user?._id) || user?.role === 'admin';

  if (!isOwner) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>You can only edit your own listings</h3>
          <p>This listing belongs to another student.</p>
          <Link to={`/products/${id}`} className="btn btn--primary">
            View listing
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const { data } = await api.put(`/products/${id}`, formData);
      toast.success('Listing updated successfully.');
      navigate(`/products/${data.data.product._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <Link to={`/products/${id}`} className="btn--link">
              <ArrowLeft size={14} style={{ verticalAlign: '-2px' }} /> Back to listing
            </Link>
            <h1 style={{ marginTop: 6 }}>Edit listing</h1>
            <p>Update photos, pricing or details. Changes go live immediately.</p>
          </div>
        </div>
        <div className="profile-grid">
          <ProductForm
            initial={product}
            user={user}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Save changes"
          />
          <aside className="card card--pad">
            <h3 style={{ marginTop: 0 }}>Listing status</h3>
            <p className="small muted">
              {product.status === 'sold'
                ? 'This listing is marked as sold and is hidden from the public marketplace.'
                : 'This listing is visible to students browsing the marketplace.'}
            </p>
            <Link to={`/products/${id}`} className="btn btn--outline btn--block">
              View public listing
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
