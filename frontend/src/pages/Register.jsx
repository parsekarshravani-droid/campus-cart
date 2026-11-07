import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  Building2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  Phone,
  Recycle,
  ShieldCheck,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { YEARS } from '../constants';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  college: '',
  department: '',
  year: '',
  phone: '',
  terms: false,
};

export default function Register() {
  const { user, loading, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      next.password = 'Include at least one letter and one number.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    if (form.college.trim().length < 2) next.college = 'Enter your college name.';
    if (form.department.trim().length < 2) next.department = 'Enter your department.';
    if (!form.year) next.year = 'Select your year of study.';
    if (form.phone && !/^[0-9+\-\s()]{6,20}$/.test(form.phone)) next.phone = 'Enter a valid phone number.';
    if (!form.terms) next.terms = 'Please accept the terms to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { terms, ...payload } = form;
      const data = await register({ ...payload, email: payload.email.trim().toLowerCase() });
      toast.success(data.message || 'Account created successfully!');
      if (data.data?.emailVerification?.sent) {
        toast.info('Check your inbox to verify your college email.');
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
            <GraduationCap size={13} /> Join your campus marketplace
          </span>
          <h1>Turn last semester&apos;s stuff into this semester&apos;s budget.</h1>
          <p>Create your student account to buy, sell and save with people from your own college.</p>
          <div className="auth__points">
            <div className="auth__point">
              <BookOpen size={17} /> Textbooks, calculators, cycles and hostel essentials.
            </div>
            <div className="auth__point">
              <Recycle size={17} /> Give useful things a second life instead of throwing them away.
            </div>
            <div className="auth__point">
              <ShieldCheck size={17} /> Wishlists, private messages and a personal seller dashboard.
            </div>
          </div>
        </div>

        <p className="auth__panel-foot">© 2026 CAMPUS CART. Built for students, by students.</p>
      </aside>

      <div className="auth__form-side">
        <div className="auth__form">
          <div className="auth__head">
            <h2>Create your account</h2>
            <p>Takes a minute. Use your college email so buyers know you are a real student.</p>
          </div>

          {serverError && (
            <div className="form-error" style={{ marginBottom: 16 }} role="alert">
              <AlertCircle size={16} /> {serverError}
            </div>
          )}

          <form className="form" onSubmit={submit} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="name">
                Full name
              </label>
              <div className="input-group">
                <User size={17} />
                <input
                  id="name"
                  className="input"
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  autoComplete="name"
                  placeholder="Aarav Mehta"
                />
              </div>
              {errors.name && <p className="field__error">{errors.name}</p>}
            </div>

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
                  onChange={(event) => setField('email', event.target.value)}
                  autoComplete="email"
                  placeholder="you@campus.edu"
                />
              </div>
              {errors.email ? (
                <p className="field__error">{errors.email}</p>
              ) : (
                <p className="field__hint">We may send a verification link if email delivery is configured.</p>
              )}
            </div>

            <div className="form-grid">
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
                    onChange={(event) => setField('password', event.target.value)}
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
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
                {errors.password && <p className="field__error">{errors.password}</p>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <div className="input-group">
                  <Lock size={17} />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    value={form.confirmPassword}
                    onChange={(event) => setField('confirmPassword', event.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                  />
                </div>
                {errors.confirmPassword && <p className="field__error">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="college">
                College name
              </label>
              <div className="input-group">
                <Building2 size={17} />
                <input
                  id="college"
                  className="input"
                  value={form.college}
                  onChange={(event) => setField('college', event.target.value)}
                  placeholder="Atharva College Of Engineering"
                />
              </div>
              {errors.college && <p className="field__error">{errors.college}</p>}
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field__label" htmlFor="department">
                  Department
                </label>
                <input
                  id="department"
                  className="input"
                  value={form.department}
                  onChange={(event) => setField('department', event.target.value)}
                  placeholder="Computer Science"
                />
                {errors.department && <p className="field__error">{errors.department}</p>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="year">
                  Year of study
                </label>
                <select
                  id="year"
                  className="select"
                  value={form.year}
                  onChange={(event) => setField('year', event.target.value)}
                >
                  <option value="">Select year</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.year && <p className="field__error">{errors.year}</p>}
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="phone">
                Phone <span className="muted small">optional, kept private</span>
              </label>
              <div className="input-group">
                <Phone size={17} />
                <input
                  id="phone"
                  className="input"
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  placeholder="98765 43210"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <p className="field__error">{errors.phone}</p>}
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(event) => setField('terms', event.target.checked)}
              />
              <span>
                I agree to the <Link to="/terms">Terms &amp; Conditions</Link> and{' '}
                <Link to="/privacy">Privacy Policy</Link>, and I will only list items I own.
              </span>
            </label>
            {errors.terms && <p className="field__error">{errors.terms}</p>}

            <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
              {submitting && <Loader2 size={16} />} {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth__foot">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
