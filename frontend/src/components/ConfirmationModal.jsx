import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';

export default function ConfirmationModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onCancel}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <span className="spinner spinner--sm spinner--on-primary" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="row" style={{ alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <span className={`modal__icon ${danger ? 'modal__icon--danger' : ''}`}>
          <AlertTriangle size={21} />
        </span>
        <div>
          <p className="muted" style={{ margin: 0 }}>
            {message}
          </p>
        </div>
      </div>
      {children}
    </Modal>
  );
}
