import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, PackageSearch, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Pagination from '../components/Pagination.jsx';
import EmptyState from '../components/EmptyState.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import api, { getErrorMessage } from '../services/api';
import { CATEGORIES, CONDITIONS, SORT_OPTIONS } from '../constants';

const FILTER_KEYS = ['q', 'category', 'condition', 'college', 'minPrice', 'maxPrice', 'sort', 'page'];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ products: [], total: 0, totalPages: 1, page: 1, limit: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ categories: [], conditions: CONDITIONS, colleges: [] });
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      q: params.get('q') || '',
      category: params.get('category') || '',
      condition: params.get('condition') || '',
      college: params.get('college') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      sort: params.get('sort') || 'newest',
      page: Number(params.get('page')) || 1,
    }),
    [params]
  );

  const update = (patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value == null) next.delete(key);
      else next.set(key, String(value));
    });
    if (resetPage && !('page' in patch)) next.delete('page');
    setParams(next);
  };

  const clearFilters = () => setParams(new URLSearchParams());

  useEffect(() => {
    api
      .get('/products/meta')
      .then(({ data: res }) => setMeta(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const query = new URLSearchParams();
    FILTER_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) query.set(key, value);
    });
    query.set('limit', '12');

    api
      .get(`/products?${query.toString()}`)
      .then(({ data: res }) => {
        if (active) setData(res.data);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [params]);

  const activeChips = [
    filters.category && { key: 'category', label: filters.category },
    filters.condition && { key: 'condition', label: filters.condition },
    filters.college && { key: 'college', label: filters.college },
    (filters.minPrice || filters.maxPrice) && {
      key: 'price',
      label: `₹${filters.minPrice || 0} – ₹${filters.maxPrice || '∞'}`,
    },
    filters.q && { key: 'q', label: `“${filters.q}”` },
  ].filter(Boolean);

  const removeChip = (key) => {
    if (key === 'price') update({ minPrice: '', maxPrice: '' });
    else update({ [key]: '' });
  };

  return (
    <>
      <div className="browse-head">
        <div className="container">
          <div className="page-head" style={{ marginBottom: 18 }}>
            <div>
              <h1>Browse the campus marketplace</h1>
              <p>Second-hand books, gadgets and hostel essentials from students like you.</p>
            </div>
            <Link to="/sell" className="btn btn--primary">
              Sell an item
            </Link>
          </div>
          <SearchBar initialValue={filters.q} onSubmit={(value) => update({ q: value })} />
        </div>
      </div>

      <div className="page">
        <div className="container">
          <div className="browse-layout">
            <aside className={`filters ${showFilters ? 'is-open' : ''}`}>
              <div className="filters__head">
                <h3>
                  <SlidersHorizontal size={17} /> Filters
                </h3>
                <button type="button" className="btn--link" onClick={clearFilters}>
                  <RotateCcw size={13} style={{ verticalAlign: '-2px' }} /> Reset
                </button>
              </div>

              <div className="filter-group">
                <h4>Category</h4>
                <div className="chip-group">
                  {CATEGORIES.map(({ name, short }) => (
                    <button
                      key={name}
                      type="button"
                      className={`chip ${filters.category === name ? 'is-active' : ''}`}
                      onClick={() => update({ category: filters.category === name ? '' : name })}
                    >
                      {short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <h4>Condition</h4>
                <div className="chip-group">
                  {CONDITIONS.map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      className={`chip ${filters.condition === condition ? 'is-active' : ''}`}
                      onClick={() => update({ condition: filters.condition === condition ? '' : condition })}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <h4>Price range (₹)</h4>
                <div className="filter-price">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(event) => update({ minPrice: event.target.value })}
                    aria-label="Minimum price"
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(event) => update({ maxPrice: event.target.value })}
                    aria-label="Maximum price"
                  />
                </div>
              </div>

              <div className="filter-group">
                <h4>College</h4>
                <select
                  className="select"
                  value={filters.college}
                  onChange={(event) => update({ college: event.target.value })}
                  aria-label="Filter by college"
                >
                  <option value="">All colleges</option>
                  {meta.colleges?.map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>
              </div>
            </aside>

            <section>
              <div className="browse-toolbar">
                <div className="browse-toolbar__count">
                  {loading ? 'Loading listings…' : (
                    <>
                      <strong>{data.total}</strong> listing{data.total === 1 ? '' : 's'} found
                      {filters.q && <> for “{filters.q}”</>}
                    </>
                  )}
                </div>
                <div className="row">
                  <button
                    type="button"
                    className="btn btn--outline btn--sm mobile-filter-toggle"
                    onClick={() => setShowFilters((open) => !open)}
                  >
                    <Filter size={15} /> Filters
                  </button>
                  <div className="browse-toolbar__sort">
                    <label htmlFor="sort">Sort by</label>
                    <select
                      id="sort"
                      className="select"
                      value={filters.sort}
                      onChange={(event) => update({ sort: event.target.value })}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {activeChips.length > 0 && (
                <div className="active-filters">
                  {activeChips.map((chip) => (
                    <span key={chip.key} className="filter-pill">
                      {chip.label}
                      <button type="button" onClick={() => removeChip(chip.key)} aria-label={`Remove ${chip.label}`}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="product-grid">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="skeleton skeleton-card" />
                  ))}
                </div>
              ) : error ? (
                <EmptyState
                  icon={PackageSearch}
                  title="Could not load listings"
                  description={error}
                  action={
                    <button type="button" className="btn btn--primary" onClick={() => setParams(new URLSearchParams(params))}>
                      Try again
                    </button>
                  }
                />
              ) : data.products.length === 0 ? (
                <EmptyState
                  icon={PackageSearch}
                  title="No listings match your filters"
                  description="Try a different search term, widen your price range, or clear the filters to see everything on campus."
                  action={
                    <>
                      <button type="button" className="btn btn--outline" onClick={clearFilters}>
                        Clear filters
                      </button>
                      <Link to="/sell" className="btn btn--primary">
                        Sell an item
                      </Link>
                    </>
                  }
                />
              ) : (
                <>
                  <div className="product-grid">
                    {data.products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    onChange={(page) => update({ page }, { resetPage: false })}
                  />
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
