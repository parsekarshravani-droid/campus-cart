import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { assetUrl } from '../services/api';

export default function SmartImage({ src, alt = '', className = '', ...rest }) {
  const [failed, setFailed] = useState(false);
  const resolved = assetUrl(src);

  if (!resolved || failed) {
    return (
      <div className="image-fallback" role="img" aria-label={alt || 'Image unavailable'}>
        <ImageOff size={26} />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
