import { initials } from '../utils/format';
import { assetUrl } from '../services/api';

export default function Avatar({ user, name, src, size = 'md', className = '' }) {
  const displayName = name || user?.name || 'Campus Cart';
  const image = src || user?.profileImage;
  const classes = `avatar avatar--${size} ${className}`.trim();

  if (image) {
    return (
      <img
        className={classes}
        src={assetUrl(image)}
        alt={displayName}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <span className={classes} aria-hidden="true" title={displayName}>
      {initials(displayName)}
    </span>
  );
}
