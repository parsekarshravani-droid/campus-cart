import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, CalendarDays, Package, Settings, ShieldCheck } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/Avatar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../utils/format';

export default function PublicProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/users/${id}`)
      .then(({ data: res }) => active && setData(res.data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <LoadingSpinner fullPage label="Loading student profile…" />;

  if (error || !data) {
    return (
      <div className="page container">
        <EmptyState
          icon={Package}
          title="Student not found"
          description={error || 'This student profile is no longer available.'}
          action={
            <Link to="/products" className="btn btn--primary">
              Back to marketplace
            </Link>
          }
        />
      </div>
    );
  }

  const { user: seller, stats, listings } = data;
  const isMe = String(user?._id) === String(seller._id);

  return (
    <div className="page">
      <div className="container">
        <div className="card card--pad" style={{ marginBottom: 30 }}>
          <div className="row row--between">
            <div className="profile-head">
              <Avatar user={seller} size="xl" />
              <div>
                <h1>{seller.name}</h1>
                <p>
                  {seller.department} · {seller.year} · {seller.college}
                </p>
                <div className="row small muted" style={{ marginTop: 8 }}>
                  {seller.isVerified && (
                    <span className="badge badge--indigo">
                      <BadgeCheck size={12} /> Verified student
                    </span>
                  )}
                  <span>
                    <CalendarDays size={13} style={{ verticalAlign: '-2px' }} /> Joined {formatDate(seller.createdAt)}
                  </span>
                  <span>
                    <Package size={13} style={{ verticalAlign: '-2px' }} /> {stats.listingCount} listings ·{' '}
                    {stats.soldCount} sold
                  </span>
                </div>
              </div>
            </div>
            {isMe ? (
              <Link to="/profile" className="btn btn--outline">
                <Settings size={15} /> Edit my profile
              </Link>
            ) : (
              <Link to={`/products?college=${encodeURIComponent(seller.college)}`} className="btn btn--soft">
                More from this college
              </Link>
            )}
          </div>
        </div>

        <div className="section__head">
          <div>
            <h2 className="section__title">Listings by {seller.name.split(' ')[0]}</h2>
            <p>Available items from this student.</p>
          </div>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No active listings"
            description="This student has no available items right now. Check back later."
            action={
              <Link to="/products" className="btn btn--primary">
                Browse other listings
              </Link>
            }
          />
        ) : (
          <div className="product-grid">
            {listings.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        <p className="small muted" style={{ marginTop: 24 }}>
          <ShieldCheck size={13} style={{ verticalAlign: '-2px' }} /> CAMPUS CART never shows student email addresses or
          phone numbers publicly. Use the Contact seller button on a listing to get in touch.
        </p>
      </div>
    </div>
  );
}
