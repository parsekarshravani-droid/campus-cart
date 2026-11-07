import { Link } from 'react-router-dom';
import { categoryIcon } from '../constants';

export default function CategoryCard({ name, count, to }) {
  const Icon = categoryIcon(name);
  return (
    <Link to={to || `/products?category=${encodeURIComponent(name)}`} className="category-card">
      <span className="category-card__icon">
        <Icon size={22} />
      </span>
      <h4>{name}</h4>
      <span>{typeof count === 'number' ? `${count} listing${count === 1 ? '' : 's'}` : 'Browse listings'}</span>
    </Link>
  );
}
