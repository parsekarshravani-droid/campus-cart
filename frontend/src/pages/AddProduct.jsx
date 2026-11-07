import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeIndianRupee, Camera, Lightbulb, ShieldCheck } from 'lucide-react';
import ProductForm from '../components/ProductForm.jsx';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import api, { getErrorMessage } from '../services/api';

export default function AddProduct() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/products', formData);
      toast.success('Listing published! It is now live on the campus marketplace.');
      navigate(`/products/${data.data.product._id}`);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Sell an item</h1>
            <p>List something you no longer need. Add clear photos and an honest description to sell faster.</p>
          </div>
          <Link to="/my-listings" className="btn btn--outline">
            My listings
          </Link>
        </div>

        <div className="profile-grid">
          <ProductForm
            user={user}
            onSubmit={handleSubmit}
            submitting={submitting}
            serverError={error}
            submitLabel="Publish listing"
          />

          <aside className="stack">
            <div className="card card--pad">
              <h3 style={{ marginTop: 0 }}>
                <Lightbulb size={17} style={{ color: 'var(--warning)', verticalAlign: '-2px' }} /> Sell faster
              </h3>
              <ul className="stack" style={{ gap: 12 }}>
                {[
                  'Use natural daylight and photograph the actual item.',
                  'Mention the edition, model number or size in the title.',
                  'Price 40–60% below new for used books and electronics.',
                  'Be upfront about scratches, missing parts or wear.',
                ].map((tip) => (
                  <li key={tip} className="small muted" style={{ display: 'flex', gap: 8 }}>
                    <Camera size={15} style={{ color: 'var(--primary)', flex: 'none', marginTop: 2 }} /> {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card card--pad">
              <h3 style={{ marginTop: 0 }}>
                <ShieldCheck size={17} style={{ color: 'var(--success)', verticalAlign: '-2px' }} /> Safe selling
              </h3>
              <p className="small muted" style={{ marginBottom: 0 }}>
                Your email and phone number are never shown publicly. Buyers contact you through CAMPUS CART messages,
                and you decide where on campus to meet.
              </p>
            </div>

            <div className="card card--pad">
              <h3 style={{ marginTop: 0 }}>
                <BadgeIndianRupee size={17} style={{ color: 'var(--primary)', verticalAlign: '-2px' }} /> Pricing help
              </h3>
              <p className="small muted" style={{ marginBottom: 8 }}>
                Add the original price so buyers instantly see their savings. A ₹1,595 calculator at ₹650 shows a 59%
                saving.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
