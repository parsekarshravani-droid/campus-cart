import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar.jsx';
import { YEARS } from '../constants';
import { formatDate } from '../utils/format';

export default function Profile() {
  const { user, emailVerification, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    college: '',
    department: '',
    year: '',
    phone: '',
    profileImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        college: user.college || '',
        department: user.department || '',
        year: user.year || '',
        phone: user.phone || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.name.trim().length < 2) return setError('Enter your full name.');
    if (form.college.trim().length < 2) return setError('Enter your college name.');
    if (form.department.trim().length < 2) return setError('Enter your department.');
    if (!form.year) return setError('Select your year of study.');

    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.data.user);
      toast.success('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-verification');
      if (data.data?.sent) toast.success(data.message);
      else toast.info(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Profile settings</h1>
            <p>Keep your student details up to date. Your email and phone are never shown publicly.</p>
          </div>
          <Link to={`/students/${user?._id}`} className="btn btn--outline">
            View public profile
          </Link>
        </div>

        {!user?.isVerified && (
          <div className="verify-banner">
            <ShieldAlert size={18} />
            <span>
              {emailVerification.required
                ? 'Your college email is not verified. Check your inbox or resend the verification link.'
                : 'Email verification is not configured on this deployment, so your account shows as unverified.'}
            </span>
            {emailVerification.required && (
              <button type="button" className="btn btn--outline btn--sm" onClick={resend} disabled={resending}>
                {resending ? 'Sending…' : 'Resend email'}
              </button>
            )}
          </div>
        )}

        <div className="profile-grid">
          <form className="card card--pad form" onSubmit={submit}>
            <h3 style={{ marginTop: 0 }}>Student details</h3>
            {error && (
              <div className="form-error" role="alert">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="form-grid">
              <div className="field field--full">
                <label className="field__label" htmlFor="name">
                  Full name
                </label>
                <input id="name" className="input" value={form.name} onChange={set('name')} maxLength={80} />
              </div>

              <div className="field field--full">
                <label className="field__label" htmlFor="email">
                  College email (cannot be changed)
                </label>
                <div className="input-group">
                  <Mail size={17} />
                  <input id="email" className="input" value={user?.email || ''} disabled />
                </div>
              </div>

              <div className="field field--full">
                <label className="field__label" htmlFor="college">
                  College
                </label>
                <input id="college" className="input" value={form.college} onChange={set('college')} maxLength={120} />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="department">
                  Department
                </label>
                <input
                  id="department"
                  className="input"
                  value={form.department}
                  onChange={set('department')}
                  maxLength={80}
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="year">
                  Year of study
                </label>
                <select id="year" className="select" value={form.year} onChange={set('year')}>
                  <option value="">Select year</option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="phone">
                  Phone (private)
                </label>
                <input id="phone" className="input" value={form.phone} onChange={set('phone')} placeholder="Optional" />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="profileImage">
                  Profile image URL
                </label>
                <input
                  id="profileImage"
                  className="input"
                  value={form.profileImage}
                  onChange={set('profileImage')}
                  placeholder="https://…"
                />
                <p className="field__hint">Paste a link to a photo of yourself. Leave empty for your initials.</p>
              </div>
            </div>

            <div className="row row--end">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving && <Loader2 size={16} />} {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>

          <aside className="stack">
            <div className="card card--pad text-center">
              <Avatar user={{ ...user, ...form }} size="xl" />
              <h3 style={{ margin: '14px 0 2px' }}>{form.name || user?.name}</h3>
              <p className="small muted">
                {user?.department} · {user?.year}
              </p>
              {user?.isVerified ? (
                <span className="badge badge--success">
                  <BadgeCheck size={13} /> Verified student
                </span>
              ) : (
                <span className="badge badge--amber">
                  <ShieldAlert size={13} /> Unverified
                </span>
              )}
            </div>

            <div className="card card--pad">
              <h3 style={{ marginTop: 0 }}>Account</h3>
              <div className="stack" style={{ gap: 10 }}>
                <div className="row small">
                  <User size={15} className="muted" />
                  <span className="muted">Role</span>
                  <span className="spacer" />
                  <span className="badge badge--indigo">{user?.role}</span>
                </div>
                <div className="row small">
                  <CalendarDays size={15} className="muted" />
                  <span className="muted">Member since</span>
                  <span className="spacer" />
                  <strong>{formatDate(user?.createdAt)}</strong>
                </div>
                <div className="row small">
                  <ShieldCheck size={15} className="muted" />
                  <span className="muted">Email status</span>
                  <span className="spacer" />
                  {user?.isVerified ? (
                    <span className="badge badge--success">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="badge badge--amber">Not verified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="note">
              <ShieldCheck size={16} />
              <span>
                Passwords are hashed with bcrypt, sessions use httpOnly cookies, and account details are never shared
                publicly.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
