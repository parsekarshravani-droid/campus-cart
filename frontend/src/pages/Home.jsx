import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  GraduationCap,
  Handshake,
  Plus,
  Recycle,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import ProductCard from '../components/ProductCard.jsx';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CATEGORIES } from '../constants';

const HERO_IMAGES = {
  main: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
  second: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=700&q=80',
  third: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80',
};

const STEPS = [
  {
    title: 'Discover',
    body: 'Browse textbooks, calculators, cycles and hostel gear listed by students on your own campus.',
    icon: Search,
  },
  {
    title: 'Connect',
    body: 'Message the seller right here on CAMPUS CART — no phone numbers or email addresses needed.',
    icon: Handshake,
  },
  {
    title: 'Exchange',
    body: 'Meet at a campus spot, check the item, pay directly and give it a second life.',
    icon: Recycle,
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [meta, setMeta] = useState({ categories: CATEGORIES.map((c) => ({ name: c.name, count: 0 })) });
  const [stats, setStats] = useState({ total: 0, colleges: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/products?limit=8&sort=newest'), api.get('/products/meta')])
      .then(([list, metaRes]) => {
        if (!active) return;
        setFeatured(list.data.data.products);
        setStats({ total: list.data.data.total, colleges: metaRes.data.data.colleges.length });
        setMeta(metaRes.data.data);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const goSearch = (value) => {
    navigate(`/products?q=${encodeURIComponent(value)}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="eyebrow">
              <Sparkles size={13} /> Student-only marketplace
            </span>
            <h1>
              Your Campus.
              <br />
              <span className="text-gradient">Your Marketplace.</span>
            </h1>
            <p className="hero__lead">
              Buy and sell everything you need, right within your college community. Save money, find great deals, and
              give your unused stuff a second life.
            </p>

            <div className="hero__search">
              <SearchBar onSubmit={goSearch} buttonLabel="Search" />
            </div>

            <div className="hero__actions">
              <Link to="/products" className="btn btn--primary btn--lg">
                Browse Products <ArrowRight size={17} />
              </Link>
              <Link to={user ? '/sell' : '/register'} className="btn btn--outline btn--lg">
                <Plus size={17} /> Sell Your Item
              </Link>
            </div>

            <div className="hero__stats">
              <div className="hero__stat">
                <strong>{stats.total}</strong>
                <span>Live campus listings</span>
              </div>
              <div className="hero__stat">
                <strong>9</strong>
                <span>Student categories</span>
              </div>
              <div className="hero__stat">
                <strong>{Math.max(stats.colleges, 1)}</strong>
                <span>Campus communities</span>
              </div>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="hero__blob" />
            <div className="hero__photo hero__photo--main">
              <img src={HERO_IMAGES.main} alt="" />
            </div>
            <div className="hero__photo hero__photo--second">
              <img src={HERO_IMAGES.second} alt="" />
            </div>
            <div className="hero__photo hero__photo--third">
              <img src={HERO_IMAGES.third} alt="" />
            </div>
            <div className="hero__float hero__float--price">
              <span className="hero__float-icon" style={{ color: '#16A34A' }}>
                <TrendingUp size={18} />
              </span>
              <div>
                <strong>Save up to 70%</strong>
                <span>vs buying new</span>
              </div>
            </div>
            <div className="hero__float hero__float--deal">
              <span className="hero__float-icon">
                <BadgeCheck size={18} />
              </span>
              <div>
                <strong>Verified students</strong>
                <span>Same campus, safer deals</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="trust-strip">
            <div className="trust-item">
              <ShieldCheck size={19} />
              <div>
                <strong>Campus-only community</strong>
                <span>College email registration keeps deals local.</span>
              </div>
            </div>
            <div className="trust-item">
              <GraduationCap size={19} />
              <div>
                <strong>Made for students</strong>
                <span>Books, calculators, cycles and hostel gear.</span>
              </div>
            </div>
            <div className="trust-item">
              <Users size={19} />
              <div>
                <strong>Direct conversations</strong>
                <span>Message sellers without sharing contact details.</span>
              </div>
            </div>
            <div className="trust-item">
              <Recycle size={19} />
              <div>
                <strong>Less waste on campus</strong>
                <span>Reuse what seniors no longer need.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <h2 className="section__title">Shop by category</h2>
              <p>Everything a student needs, organised the way campus life actually works.</p>
            </div>
            <Link to="/products" className="btn btn--ghost btn--sm">
              View all listings <ArrowRight size={15} />
            </Link>
          </div>
          <div className="category-grid">
            {(meta.categories?.length ? meta.categories : CATEGORIES).map((category) => (
              <CategoryCard key={category.name} name={category.name} count={category.count} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <div className="section__head">
            <div>
              <h2 className="section__title">Fresh on campus</h2>
              <p>Recently added listings from students in your college community.</p>
            </div>
            <Link to="/products?sort=newest" className="btn btn--outline btn--sm">
              Browse everything <ArrowRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton skeleton-card" />
              ))}
            </div>
          ) : featured.length ? (
            <div className="product-grid">
              {featured.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state__icon">
                <Sparkles size={26} />
              </span>
              <h3>No listings yet</h3>
              <p>Be the first to list something on CAMPUS CART and kick off your campus marketplace.</p>
              <div className="empty-state__actions">
                <Link to={user ? '/sell' : '/register'} className="btn btn--primary">
                  <Plus size={16} /> Post the first listing
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <span className="eyebrow">
                <Handshake size={13} /> How it works
              </span>
              <h2 className="section__title" style={{ marginTop: 12 }}>
                Three steps from clutter to cash
              </h2>
            </div>
          </div>
          <div className="steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="step-card">
                  <span className="step-card__num">{index + 1}</span>
                  <h3>
                    {step.title} <Icon size={16} style={{ color: 'var(--primary)', verticalAlign: '-2px' }} />
                  </h3>
                  <p>{step.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="cta-band">
            <h2>Got something you no longer use? Someone on campus needs it.</h2>
            <p>
              List your books, gadgets or hostel essentials in under two minutes. Messaging, wishlists and your seller
              dashboard are built in.
            </p>
            <div className="cta-band__actions">
              <Link to={user ? '/sell' : '/register'} className="btn btn--secondary btn--lg">
                <Plus size={17} /> Start selling
              </Link>
              <Link to="/products" className="btn btn--outline btn--lg">
                Explore the marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
