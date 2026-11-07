import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, BadgeCheck, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';

export default function Login() {
  const { user, loading, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(form.email.trim(), form.password);
      toast.success(data.message || 'Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => setForm({ email: 'aarav@campus.edu', password: 'Student@123' });

  return (
    <div className="auth">
      <aside className="auth__panel">
        <Link to="/" className="brand">
          <span className="brand__mark">
            <ShoppingBag size={20} />
          </span>
          <span className="brand__text">
            CAMPUS<em style={{ color: '#c7d2fe' }}>CART</em>
          </span>
        </Link>

        <div className="auth__pitch">
          <span className="badge badge--violet" style={{ background: 'rgba(255,255,255,.14)', color: '#e0e7ff' }}>
            <BadgeCheck size={13} /> Buy Smart. Sell Easy. Campus Connected.
          </span>
          <h1>Welcome back to your campus marketplace.</h1>
          <p>Sign in to manage your listings, reply to buyers and pick up right where you left off.</p>
          <div className="auth__points">
            <div className="auth__point">
              <ShieldCheck size={17} /> College-only community with verified student accounts.
            </div>
            <div className="auth__point">
              <Lock size={17} /> Secure httpOnly cookie sessions — your token never touches JavaScript.
            </div>
            <div className="auth__point">
              <Mail size={17} /> Message sellers privately without sharing your phone number.
            </div>
          </div>
        </div>

        <p className="auth__panel-foot">© 2026 CAMPUS CART. Built for students, by students.</p>
      </aside>

      <div className="auth__form-side">
        <div className="auth__form">
          <div className="auth__head">
            <h2>Log in</h2>
            <p>Use the college email you registered with.</p>
          </div>

          {error && (
            <div className="form-error" style={{ marginBottom: 16 }} role="alert">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form className="form" onSubmit={submit}>
            <div className="field">
              <label className="field__label" htmlFor="email">
                College email
              </label>
              <div className="input-group">
                <Mail size={17} />
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  autoComplete="email"
                  placeholder="you@campus.edu"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                Password
              </label>
              <div className="input-group">
                <Lock size={17} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  autoComplete="current-password"
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  className="input-group__action"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
              {submitting && <Loader2 size={16} />} {submitting ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          <p className="auth__foot">
            New to CAMPUS CART? <Link to="/register">Create an account</Link>
          </p>

          {import.meta.env.DEV && (
            <div className="auth__demo">
              <strong>Demo accounts (development seed data)</strong>
              <div style={{ marginTop: 4 }}>
                Student: <code>aarav@campus.edu</code> / <code>Student@123</code>
                <br />
                Admin: <code>admin@campus.edu</code> / <code>Admin@12345</code>
              </div>
              <button type="button" className="btn--link" style={{ marginTop: 8 }} onClick={fillDemo}>
                Fill student credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
