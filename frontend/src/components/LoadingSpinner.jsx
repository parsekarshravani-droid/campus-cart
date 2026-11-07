export default function LoadingSpinner({ label = 'Loading…', fullPage = false, small = false }) {
  return (
    <div className="loading-wrap" style={fullPage ? { minHeight: '60vh' } : undefined} role="status" aria-live="polite">
      <span className={`spinner ${small ? 'spinner--sm' : ''}`} />
      {label && <span>{label}</span>}
    </div>
  );
}
