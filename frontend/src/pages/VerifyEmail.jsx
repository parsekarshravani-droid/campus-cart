import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, MailCheck, ShoppingBag } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { user, updateUser } = useAuth();
  const [state, setState] = useState({ status: token ? 'loading' : 'missing', message: '' });

  useEffect(() => {
    if (!token) return;
    let active = true;
    api
      .post('/auth/verify-email', { token })
      .then(({ data }) => {
        if (!active) return;
        setState({ status: 'success', message: data.message });
        if (user) updateUser({ isVerified: true });
      })
      .catch((err) => active && setState({ status: 'error', message: getErrorMessage(err) }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="auth" style={{ gridTemplateColumns: '1fr' }}>
      <div className="auth__form-side">
        <div className="auth__form text-center">
          <Link to="/" className="brand" style={{ justifyContent: 'center', marginBottom: 24 }}>
            <span className="brand__mark">
              <ShoppingBag size={20} />
            </span>
            <span className="brand__text">
              CAMPUS<em>CART</em>
            </span>
          </Link>

          {state.status === 'loading' && (
            <>
              <Loader2 size={34} className="spinner" style={{ margin: '0 auto 16px' }} />
              <h2>Verifying your email…</h2>
              <p className="muted">Hang tight while we confirm your college email address.</p>
            </>
          )}

          {state.status === 'success' && (
            <>
              <span className="modal__icon" style={{ margin: '0 auto 16px', width: 58, height: 58 }}>
                <CheckCircle2 size={26} />
              </span>
              <h2>Email verified</h2>
              <p className="muted">{state.message}</p>
              <Link to={user ? '/dashboard' : '/login'} className="btn btn--primary btn--block">
                {user ? 'Go to dashboard' : 'Log in to continue'}
              </Link>
            </>
          )}

          {(state.status === 'error' || state.status === 'missing') && (
            <>
              <span className="modal__icon modal__icon--danger" style={{ margin: '0 auto 16px', width: 58, height: 58 }}>
                <AlertCircle size={26} />
              </span>
              <h2>{state.status === 'missing' ? 'No verification token' : 'Verification failed'}</h2>
              <p className="muted">
                {state.message ||
                  'Open the verification link from your email. If it has expired, ask for a new one from your profile.'}
              </p>
              <Link to={user ? '/profile' : '/login'} className="btn btn--primary btn--block">
                {user ? 'Resend from profile' : 'Back to login'}
              </Link>
            </>
          )}

          <p className="auth__foot">
            <MailCheck size={14} style={{ verticalAlign: '-2px' }} /> Verification links expire after 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
