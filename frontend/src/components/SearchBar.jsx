import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  initialValue = '',
  onSubmit,
  placeholder = 'Search books, calculators, bicycles, laptops…',
  buttonLabel = 'Search',
  autoFocus = false,
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const submit = (event) => {
    event.preventDefault();
    onSubmit?.(value.trim());
  };

  return (
    <form className="search-bar" onSubmit={submit} role="search">
      <Search size={19} />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => {
            setValue('');
            onSubmit?.('');
          }}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
      <button type="submit" className="btn btn--primary">
        {buttonLabel}
      </button>
    </form>
  );
}
