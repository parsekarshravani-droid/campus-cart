import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let index = start; index <= end; index += 1) pages.push(index);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft size={16} />
      </button>
      {start > 1 && (
        <>
          <button type="button" onClick={() => onChange(1)}>
            1
          </button>
          {start > 2 && <span className="muted small">…</span>}
        </>
      )}
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          className={number === page ? 'is-active' : ''}
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
        >
          {number}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="muted small">…</span>}
          <button type="button" onClick={() => onChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
