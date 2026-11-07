import { Link } from 'react-router-dom';
import { Heart, MapPin, ArrowRight, User } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { CONDITION_TONE } from '../constants';
import { discountPercent, firstImage, formatINR } from '../utils/format';
import SmartImage from './SmartImage.jsx';

export default function ProductCard({ product }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product._id);
  const discount = discountPercent(product.price, product.originalPrice);
  const sellerName = product.seller?.name?.split(' ')[0];

  const handleWishlist = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(product._id);
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-card__media" aria-label={product.title}>
        <SmartImage src={firstImage(product)} alt={product.title} />
        <span className={`badge badge--${CONDITION_TONE[product.condition] || 'slate'} product-card__condition`}>
          {product.condition}
        </span>
        {discount && product.status === 'available' && (
          <span className="product-card__discount">-{discount}%</span>
        )}
        {product.status === 'sold' && <span className="product-card__sold">Sold</span>}
      </Link>

      <button
        type="button"
        className={`product-card__heart ${saved ? 'is-saved' : ''}`}
        onClick={handleWishlist}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
      >
        <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <Link to={`/products/${product._id}`} className="product-card__title">
          {product.title}
        </Link>

        <div className="product-card__price">
          <strong>{formatINR(product.price)}</strong>
          {product.originalPrice > product.price && <s>{formatINR(product.originalPrice)}</s>}
        </div>

        <div className="product-card__meta">
          <span>
            <MapPin size={13} /> {product.location}
          </span>
          {sellerName && (
            <span>
              <User size={13} /> {sellerName}
            </span>
          )}
        </div>

        <Link to={`/products/${product._id}`} className="btn btn--soft btn--sm btn--block">
          View details <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
