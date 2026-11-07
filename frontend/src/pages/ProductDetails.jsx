import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Eye,
  Heart,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  ShieldCheck,
  Trash2,
  User,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { CONDITION_TONE, STATUS_TONE } from '../constants';
import { discountPercent, formatDate, formatINR, timeAgo } from '../utils/format';
import SmartImage from '../components/SmartImage.jsx';
import Avatar from '../components/Avatar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmationModal from '../components/ConfirmationModal.jsx';

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { isSaved, toggle } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadProduct = () => {
    setLoading(true);
    setError('');
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.data.product);
        setRelated(data.data.related || []);
        setActiveImage(0);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadProduct, [id]);

  if (loading) return <LoadingSpinner fullPage label="Loading listing…" />;

  if (error || !product) {
    return (
      <div className="page">
        <div className="container page--narrow">
          <div className="empty-state">
            <span className="empty-state__icon">
              <Package size={26} />
            </span>
            <h3>Listing unavailable</h3>
            <p>{error || 'This listing may have been removed by the seller.'}</p>
            <div className="empty-state__actions">
              <Link to="/products" className="btn btn--primary">
                <ArrowLeft size={16} /> Back to marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && String(product.seller?._id) === String(user._id);
  const saved = isSaved(product._id);
  const discount = discountPercent(product.price, product.originalPrice);
  const images = product.images?.length ? product.images : [{ url: '', publicId: null }];

  const sendInquiry = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    if (message.trim().length < 2) {
      toast.error('Write a short message to the seller first.');
      return;
    }
    setSending(true);
    try {
      await api.post('/messages', {
        receiver: product.seller._id,
        product: product._id,
        message: message.trim(),
      });
      setContactOpen(false);
      setMessage('');
      toast.success('Message sent! The seller can now reply from their inbox.');
      navigate(`/messages/${product.seller._id}?product=${product._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const markSold = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/products/${product._id}/status`, {
        status: product.status === 'sold' ? 'available' : 'sold',
      });
      setProduct((current) => ({ ...current, status: data.data.product.status }));
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const deleteListing = async () => {
    setBusy(true);
    try {
      await api.delete(`/products/${product._id}`);
      toast.success('Listing deleted.');
      navigate('/my-listings');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Marketplace</Link>
          <span>/</span>
          <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        </nav>

        <div className="details-grid">
          <div>
            <div className="gallery__main">
              <SmartImage src={images[activeImage]?.url} alt={product.title} />
            </div>
            {images.length > 1 && (
              <div className="gallery__thumbs">
                {images.map((image, index) => (
                  <button
                    key={image.publicId || index}
                    type="button"
                    className={`gallery__thumb ${index === activeImage ? 'is-active' : ''}`}
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <SmartImage src={image.url} alt={`${product.title} preview ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="details-info">
            <div className="details-tags">
              <span className={`badge badge--${CONDITION_TONE[product.condition] || 'slate'}`}>{product.condition}</span>
              <span className={`badge badge--${STATUS_TONE[product.status] || 'slate'}`}>
                {product.status === 'available' ? 'Available' : product.status === 'sold' ? 'Sold' : 'Removed'}
              </span>
              <span className="badge badge--indigo">{product.category}</span>
            </div>

            <h1>{product.title}</h1>

            <div className="details-price">
              <strong>{formatINR(product.price)}</strong>
              {product.originalPrice > product.price && <s>{formatINR(product.originalPrice)}</s>}
              {discount && <span className="badge badge--success">{discount}% off new price</span>}
            </div>

            <div className="row small muted" style={{ gap: 16 }}>
              <span>
                <Eye size={14} style={{ verticalAlign: '-2px' }} /> {product.views || 0} views
              </span>
              <span>
                <CalendarDays size={14} style={{ verticalAlign: '-2px' }} /> Posted {timeAgo(product.createdAt)}
              </span>
            </div>

            <p className="details-description">{product.description}</p>

            <div className="details-meta">
              <div>
                <span>Category</span>
                <strong>{product.category}</strong>
              </div>
              <div>
                <span>Condition</span>
                <strong>{product.condition}</strong>
              </div>
              <div>
                <span>Pickup location</span>
                <strong>{product.location}</strong>
              </div>
              <div>
                <span>College</span>
                <strong>{product.college}</strong>
              </div>
              <div>
                <span>Listed on</span>
                <strong>{formatDate(product.createdAt)}</strong>
              </div>
              <div>
                <span>Listing ID</span>
                <strong>#{String(product._id).slice(-6).toUpperCase()}</strong>
              </div>
            </div>

            <div className="seller-card">
              <Avatar user={product.seller} size="md" />
              <div className="seller-card__body">
                <h4>
                  {product.seller?.name}
                  {product.seller?.isVerified && (
                    <BadgeCheck size={15} style={{ color: 'var(--primary)' }} aria-label="Verified student" />
                  )}
                </h4>
                <p>
                  {product.seller?.department} · {product.seller?.year} · {product.seller?.college}
                </p>
                <p>Member since {formatDate(product.seller?.createdAt)}</p>
              </div>
              <Link to={`/students/${product.seller?._id}`} className="btn btn--ghost btn--sm">
                Profile
              </Link>
            </div>

            {isOwner ? (
              <div className="owner-actions">
                <span className="badge badge--indigo">
                  <ShieldCheck size={13} /> This is your listing
                </span>
                <Link to={`/products/${product._id}/edit`} className="btn btn--outline btn--sm">
                  <Pencil size={14} /> Edit
                </Link>
                <button type="button" className="btn btn--soft btn--sm" onClick={markSold} disabled={busy}>
                  {product.status === 'sold' ? 'Mark as available' : 'Mark as sold'}
                </button>
                <button type="button" className="btn btn--danger-soft btn--sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            ) : (
              <div className="details-actions">
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={() => (user ? setContactOpen(true) : navigate('/login', { state: { from: `/products/${id}` } }))}
                  disabled={product.status !== 'available'}
                >
                  <MessageSquare size={17} />
                  {product.status === 'available' ? 'Contact seller' : 'No longer available'}
                </button>
                <button
                  type="button"
                  className={`btn btn--outline btn--lg ${saved ? 'is-saved' : ''}`}
                  onClick={() => toggle(product._id)}
                >
                  <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
                  {saved ? 'Saved' : 'Add to wishlist'}
                </button>
              </div>
            )}

            <p className="small muted" style={{ marginTop: 16 }}>
              <ShieldCheck size={13} style={{ verticalAlign: '-2px' }} /> Meet in a public campus spot, inspect the item
              before paying, and never share OTPs or bank details.
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="section">
            <div className="section__head">
              <div>
                <h2 className="section__title">More in {product.category}</h2>
                <p>Similar items listed by other students.</p>
              </div>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="btn btn--outline btn--sm">
                See all
              </Link>
            </div>
            <div className="product-grid">
              {related.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title="Message the seller"
        description={`Ask ${product.seller?.name?.split(' ')[0]} about “${product.title}”.`}
        footer={
          <>
            <button type="button" className="btn btn--outline" onClick={() => setContactOpen(false)} disabled={sending}>
              Cancel
            </button>
            <button type="submit" form="contact-form" className="btn btn--primary" disabled={sending}>
              {sending ? <Loader2 size={16} className="spinner" /> : <MessageSquare size={16} />} Send message
            </button>
          </>
        }
      >
        <form id="contact-form" onSubmit={sendInquiry} className="form">
          <div className="seller-card" style={{ margin: 0 }}>
            <Avatar user={product.seller} size="sm" />
            <div className="seller-card__body">
              <h4>{product.seller?.name}</h4>
              <p>
                <MapPin size={12} style={{ verticalAlign: '-2px' }} /> {product.college}
              </p>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="inquiry">
              Your message <span>*</span>
            </label>
            <textarea
              id="inquiry"
              className="textarea"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1200}
              placeholder="Hi! Is this still available? Would you be able to meet near the library tomorrow?"
              required
            />
            <p className="field__hint">{message.length}/1200 characters · your email and phone stay private.</p>
          </div>
          <div className="note">
            <CheckCircle2 size={16} />
            <span>Only you and the seller can read this conversation.</span>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        open={confirmDelete}
        title="Delete this listing?"
        message="This permanently removes the listing, its images, wishlist saves and conversations. This cannot be undone."
        confirmLabel="Delete listing"
        danger
        loading={busy}
        onConfirm={deleteListing}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
