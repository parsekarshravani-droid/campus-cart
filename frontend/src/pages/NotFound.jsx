import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="notfound">
      <div>
        <div className="notfound__code">404</div>
        <h1>This page wandered off campus.</h1>
        <p>
          The page you are looking for does not exist or has moved. Head back to the marketplace to keep browsing
          student listings.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/products" className="btn btn--primary">
            <Compass size={16} /> Browse listings
          </Link>
          <Link to="/" className="btn btn--outline">
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
