import { Link } from 'react-router-dom';
import { Mail, MapPin, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { CATEGORIES, TAGLINE } from '../constants';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="brand">
              <span className="brand__mark">
                <ShoppingBag size={20} />
              </span>
              <span className="brand__text">
                CAMPUS<em>CART</em>
              </span>
            </Link>
            <p>
              About CAMPUS CART — a student-only marketplace to buy, sell and reuse campus essentials. Save money,
              declutter your hostel room, and keep usable things out of the landfill.
            </p>
            <p className="small" style={{ color: '#a5b4fc', margin: 0 }}>
              {TAGLINE}
            </p>
          </div>

          <div>
            <h4>Browse Categories</h4>
            <div className="footer__links">
              {CATEGORIES.slice(0, 6).map((category) => (
                <Link key={category.name} to={`/products?category=${encodeURIComponent(category.name)}`}>
                  {category.short}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4>Marketplace</h4>
            <div className="footer__links">
              <Link to="/products">All listings</Link>
              <Link to="/sell">Sell an item</Link>
              <Link to="/wishlist">Your wishlist</Link>
              <Link to="/dashboard">Student dashboard</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms &amp; Conditions</Link>
            </div>
          </div>

          <div className="footer__contact-col">
            <h4>Contact</h4>
            <div className="footer__contact">
              <span>
                <Mail size={15} /> support@campuscart.app
              </span>
              <span>
                <MapPin size={15} /> Every campus, one marketplace
              </span>
              <span>
                <ShieldCheck size={15} /> College-verified community
              </span>
              <span>
                <Sparkles size={15} /> Built for students, by students
              </span>
            </div>
            <div className="footer__badges" style={{ marginTop: 16 }}>
              <span className="badge badge--violet">Reuse &amp; save</span>
              <span className="badge badge--violet">Campus-only</span>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© 2026 CAMPUS CART | Built for students | Created by <strong>Shravani</strong>.</span>
          <span>Buy Smart. Sell Easy. Campus Connected.</span>
        </div>
      </div>
    </footer>
  );
}
