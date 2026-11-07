# CAMPUS CART — An OLX for Your College

**Buy Smart. Sell Easy. Campus Connected.**

CAMPUS CART is a full-stack, college-exclusive marketplace where students buy and sell textbooks, calculators, laptops, bicycles, hostel furniture and other campus essentials. It is a real working product — React SPA, Express REST API, MongoDB persistence, JWT httpOnly-cookie sessions, Cloudinary image uploads, wishlists, private buyer–seller messaging, dashboards and an admin moderation console.

> Status: implemented, tested end-to-end and deployment-ready. Live deployment requires your MongoDB Atlas and Cloudinary credentials (see [Environment variables](#environment-variables)).

---

## Table of contents

1. [Features](#features)
2. [Technology stack](#technology-stack)
3. [Architecture](#architecture)
4. [Folder structure](#folder-structure)
5. [Database schema](#database-schema)
6. [API documentation](#api-documentation)
7. [Security](#security)
8. [Installation](#installation)
9. [Running the app](#running-the-app)
10. [Environment variables](#environment-variables)
11. [MongoDB Atlas setup](#mongodb-atlas-setup)
12. [Cloudinary setup](#cloudinary-setup)
13. [Testing](#testing)
14. [Deployment](#deployment)
15. [Screenshots](#screenshots)
16. [Demo data](#demo-data)
17. [Future enhancements](#future-enhancements)
18. [Known limitations](#known-limitations)

---

## Features

### Authentication & accounts
- Student registration with full name, college email, password + confirmation, college, department, year and optional phone.
- Validation on the client and the server (express-validator), bcrypt password hashing (12 salt rounds), duplicate-email handling.
- JWT stored in a **httpOnly, secure, SameSite cookie** — no tokens in localStorage.
- Session restoration after refresh via `GET /api/auth/me`, logout, protected routes, suspended-account blocking.
- Optional college email-domain restriction through `COLLEGE_EMAIL_DOMAINS`.
- Optional email verification with a hashed, 24-hour expiring token (requires SMTP configuration).

### Listings
- Create, read, update, delete listings with up to **5 images** (JPG/JPEG/PNG/WebP, max 5 MB each), image previews and removal before submission.
- Cloudinary upload with URL + public ID stored in MongoDB; old images deleted from Cloudinary when a listing is updated or deleted. Local-disk fallback for development when Cloudinary is not configured.
- Categories: Books & Study Materials, Electronics, Calculators, Bicycles, Hostel Essentials, Furniture, Sports Equipment, Stationery, Others.
- Conditions: Brand New, Like New, Good, Fair. Statuses: available, sold, removed.
- Ownership enforced: only the seller (or an admin) can edit, delete or change status.
- Mark as sold / relist from the dashboard; sold items disappear from the public marketplace.

### Discovery
- Server-side search across title, description, category and location.
- Filters: category, condition, price range, college; sorting: newest, oldest, price low→high, price high→low, most viewed.
- Server-side pagination (`page`, `limit`) with total count and total pages.
- Product details page with image gallery, price/savings, seller card, related products, wishlist and contact actions.
- Responsive product grid, skeleton loaders, empty states and error states.

### Wishlist
- Heart toggle on every product card with optimistic UI updates.
- Persistent MongoDB wishlist with a **compound unique index** (duplicates impossible).
- Dedicated wishlist page with remove and clear-all.

### Messaging
- Contact Seller modal creates a real message (sender, receiver, product, text, read flag, timestamp).
- Inbox and Sent feeds grouped per student + listing, unread counts, full conversation view.
- Conversations are strictly scoped to the two participants; empty messages and self-messaging are rejected.
- Unread badge in the navbar and on the dashboard.

### Dashboard, profile & admin
- Live counts: total/active/sold listings, wishlist items, inquiries received, unread messages, listing views.
- My Listings management: view, edit, delete, mark sold, relist, with filters and counts.
- Profile editing: name, college, department, year, phone, profile image; email is immutable; email verification status.
- Public seller profile — never exposes email or phone.
- Admin console: marketplace statistics, user search, suspend/reinstate accounts, listing search, change listing status, remove listings.
- Admin accounts are created only through the seed script (never through public registration).

### UX & design
- Custom design system (indigo `#4F46E5` → violet `#7C3AED`) with Plus Jakarta Sans / Inter, cards, soft shadows and micro-interactions.
- Sticky responsive navbar with category mega-menu, mobile drawer, user menu and counters.
- Home page hero with search, product collage, trust strip, category grid, featured listings, how-it-works and CTA.
- Toast notifications, accessible modals, keyboard focus states, reduced horizontal overflow, mobile-first breakpoints.

---

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, React Router 7, Axios, Lucide React, CSS3 |
| Backend | Node.js, Express 4, REST API, Multer 2 |
| Auth | JWT (`jsonwebtoken`), bcryptjs, httpOnly cookies |
| Database | MongoDB + Mongoose 8 (MongoDB Atlas in production) |
| Images | Cloudinary + Multer memory storage (local disk fallback in dev) |
| Email | Nodemailer (optional verification mail) |
| Security | Helmet, CORS allowlist, express-rate-limit, express-validator, custom NoSQL-injection sanitizer |
| Testing | Vitest + Supertest + mongodb-memory-server |
| Deployment | Render (API), Vercel or Netlify (SPA), MongoDB Atlas, Cloudinary |

---

## Architecture

```
┌──────────────────────┐        HTTPS / JSON        ┌────────────────────────┐
│  React SPA (Vite)    │ ─────────────────────────▶ │  Express REST API      │
│  Vercel / Netlify    │ ◀───────────────────────── │  Render                │
│                      │   JWT in httpOnly cookie   │                        │
└─────────┬────────────┘                            └───────┬────────┬───────┘
          │                                                 │        │
          │ images (CDN URLs)                               │        │
          ▼                                                 ▼        ▼
   ┌──────────────┐                                 ┌──────────────┐ ┌──────────────┐
   │  Cloudinary  │ ◀──────── upload / destroy ───── │ MongoDB Atlas │ │  SMTP (opt.) │
   └──────────────┘                                 └──────────────┘ └──────────────┘
```

- The SPA never talks to MongoDB or Cloudinary directly; all secrets stay server-side.
- In development, Vite proxies `/api` and `/uploads` to `http://localhost:5000`, so the auth cookie is same-origin. In production the SPA calls `VITE_API_URL` with CORS + credentials enabled.

---

## Folder structure

```
campus-cart/
├── backend/
│   ├── config/            db.js, cloudinary.js
│   ├── controllers/       auth, product, wishlist, user, message, admin
│   ├── middleware/        auth, admin, upload, error, validate, sanitize, rateLimiters
│   ├── models/            User, Product, Wishlist, Message
│   ├── routes/            auth, product, wishlist, user, message, admin
│   ├── seed/              seed.js (CLI), seedData.js (shared demo data)
│   ├── services/          storageService (Cloudinary/local), mailService
│   ├── tests/             auth, products, wishlist, messages, dashboard + helpers
│   ├── utils/             ApiError, asyncHandler, token
│   ├── validators/        request validation rules
│   ├── uploads/           development-only local image storage
│   ├── server.js          Express app + bootstrap
│   ├── vitest.config.js
│   └── .env.example
├── frontend/
│   ├── public/            favicon.svg
│   ├── src/
│   │   ├── components/    Navbar, Footer, ProductCard, ProductForm, SearchBar,
│   │   │                  CategoryCard, ProtectedRoute, LoadingSpinner,
│   │   │                  ConfirmationModal, Modal, EmptyState, Pagination,
│   │   │                  Avatar, SmartImage
│   │   ├── context/       AuthContext, WishlistContext, ToastContext
│   │   ├── hooks/         useAuth
│   │   ├── pages/         Home, Login, Register, VerifyEmail, Products,
│   │   │                  ProductDetails, AddProduct, EditProduct, Wishlist,
│   │   │                  Dashboard, MyListings, Profile, PublicProfile,
│   │   │                  Messages, Admin, Legal, NotFound
│   │   ├── services/      api.js (Axios + asset URLs + error helpers)
│   │   ├── utils/         format.js (INR, dates, initials, discount)
│   │   ├── App.jsx, main.jsx, index.css, constants.js
│   ├── vercel.json / netlify.toml (SPA rewrites)
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Database schema

### User
| Field | Type | Notes |
| --- | --- | --- |
| name | String | required, 2–80 chars |
| email | String | required, unique, lowercase |
| password | String | bcrypt hash, `select: false` |
| college | String | required |
| department | String | required |
| year | String | required |
| phone | String | optional, never exposed publicly |
| profileImage | String | optional URL |
| role | String | `student` \| `admin` |
| isVerified | Boolean | set only by a completed verification flow |
| isSuspended | Boolean | blocks login and listing |
| verificationToken / verificationTokenExpires | String / Date | hashed token, never selected by default |
| createdAt / updatedAt | Date | timestamps |

### Product
| Field | Type | Notes |
| --- | --- | --- |
| title, description | String | validated lengths |
| category | String | enum of 9 categories |
| price, originalPrice | Number | INR, original optional |
| condition | String | enum of 4 conditions |
| images | [{ url, publicId, provider }] | max 5, provider = cloudinary/local |
| seller | ObjectId → User | required |
| college, location | String | required |
| status | String | `available` \| `sold` \| `removed` |
| views | Number | incremented on detail view |

Indexes: `{status, createdAt}`, `{status, category, price}`, `{seller, createdAt}`, text index on title/description/category.

### Wishlist
`user → User`, `product → Product`, timestamps.
**Unique compound index `{user, product}`** prevents duplicates, plus `{user, createdAt}`.

### Message
`sender → User`, `receiver → User`, `product → Product`, `message`, `read`, timestamps.
Indexes: `{sender, receiver, product, createdAt}`, `{receiver, read, createdAt}`.

---

## API documentation

Base URL: `/api` · All responses use the shape below.

```json
{ "success": true, "message": "Products fetched.", "data": {} }
```

```json
{ "success": false, "message": "Validation failed", "errors": ["..."] }
```

### Auth
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public (rate-limited) | Create student account, set session cookie |
| POST | `/auth/login` | public (rate-limited) | Email + password login |
| POST | `/auth/logout` | public | Clear auth cookie |
| GET | `/auth/me` | private | Restore session |
| POST | `/auth/verify-email` | public | Verify email with token |
| POST | `/auth/resend-verification` | private | New verification email (if SMTP configured) |

### Products
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/products` | public | Search/filter/sort/paginate available listings |
| GET | `/products/meta` | public | Categories, conditions, colleges, price range |
| GET | `/products/:id` | public | Details + related listings + wishlist flag |
| GET | `/products/my-listings` | private | Seller's listings with counts |
| POST | `/products` | private | Create listing (multipart, `images` × 5) |
| PUT | `/products/:id` | owner/admin | Update fields/images (`removedImages` JSON) |
| DELETE | `/products/:id` | owner/admin | Delete listing, images, wishlists, messages |
| PATCH | `/products/:id/status` | owner/admin | `{ "status": "sold" \| "available" \| "removed" }` |

Query parameters for `GET /products`: `q`, `category`, `condition`, `college`, `minPrice`, `maxPrice`, `sort` (`newest|oldest|price-asc|price-desc|popular`), `page`, `limit` (max 48).

### Wishlist
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/wishlist` | private | Saved items with populated products |
| POST | `/wishlist/:productId` | private | Add (409 on duplicate) |
| DELETE | `/wishlist/:productId` | private | Remove |

### Users
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/users/profile` | private | Own profile |
| PUT | `/users/profile` | private | Update name, college, department, year, phone, photo |
| GET | `/users/dashboard` | private | Live stats, recent listings, recent inquiries |
| GET | `/users/:id` | private | Public seller profile (no email/phone) |

### Messages
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/messages` | private | `{ receiver, product, message }` |
| GET | `/messages/inbox` | private | Threads grouped by buyer + listing |
| GET | `/messages/sent` | private | Threads grouped by seller + listing |
| GET | `/messages/conversation/:userId?product=` | private | Thread between the two participants |
| PATCH | `/messages/:id/read` | receiver only | Mark as read |
| GET | `/messages/unread-count` | private | Navbar badge |

### Admin
| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/admin/stats` | admin | Marketplace statistics |
| GET | `/admin/users?q=&page=&limit=` | admin | Registered users |
| PATCH | `/admin/users/:id/suspend` | admin | `{ "suspended": true }` |
| GET | `/admin/products?q=&status=&page=` | admin | All listings |
| PATCH | `/admin/products/:id/status` | admin | Moderate status |
| DELETE | `/admin/products/:id` | admin | Remove listing |

### Health
`GET /api/health` → `{ success, message, data: { status, database, uptimeSeconds, storage, emailVerification, timestamp } }` (no secrets). Returns `503` when the database is disconnected.

---

## Security

- Passwords hashed with bcryptjs; `password` is `select: false` and stripped in `toJSON`.
- JWT delivered only through an httpOnly cookie (`secure` + `SameSite=None` in production), verified with issuer checks.
- Auth middleware rejects suspended accounts; ownership checks on every listing mutation; admin middleware for `/api/admin/*`.
- Helmet security headers, CORS allowlist from `FRONTEND_URL`, `express-rate-limit` on auth and write endpoints.
- express-validator rules on every mutation; custom recursive sanitizer strips `$`-operators and dotted keys (NoSQL injection).
- Multer validates MIME type, extension, 5 MB size limit and 5-file count; Cloudinary deletion on update/delete.
- Public seller data excludes email and phone; admin APIs never return password hashes.
- `.env` files are gitignored; all credentials come from environment variables and never reach the browser.
- No payment or card data is handled by CAMPUS CART.

---

## Installation

**Prerequisites:** Node.js 20+, npm 10+, Git. No local MongoDB needed for development (see note below).

### 1. Clone and install

```bash
git clone https://github.com/your-username/campus-cart.git
cd campus-cart

cd backend && npm install
cd ../frontend && npm install
```

Windows (PowerShell/CMD) equivalents:

```bat
cd backend && npm install
cd ..\frontend && npm install
```

### 2. Configure environment

Unix/macOS:

```bash
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env
```

Windows:

```bat
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Fill in `backend/.env` with MongoDB Atlas and Cloudinary values (see [Environment variables](#environment-variables)). For a zero-configuration first run you can leave `MONGO_URI` and Cloudinary empty — the API then starts a **disposable in-memory MongoDB** and stores uploads on local disk. Both fallbacks are development-only and clearly logged.

---

## Running the app

Open two terminals.

**Backend**

```bash
cd backend
npm run dev      # node --watch server.js
# API:   http://localhost:5000
# Health: http://localhost:5000/api/health
```

**Frontend**

```bash
cd frontend
npm run dev
# App: http://localhost:5173 (proxies /api and /uploads to :5000)
```

Production-style local run:

```bash
cd backend && npm start
cd frontend && npm run build && npm run preview
```

Seed demo data explicitly (persistent databases):

```bash
cd backend
npm run seed           # seed only if empty
npm run seed -- --reset  # wipe demo products/users and reseed
```

---

## Environment variables

### `backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | no | API port (default `5000`; Render injects its own) |
| `NODE_ENV` | yes (production) | `development` or `production` |
| `MONGO_URI` | production | MongoDB Atlas connection string. Empty = in-memory dev DB |
| `JWT_SECRET` | production | Long random string used to sign sessions |
| `JWT_EXPIRES_IN` | no | Session lifetime, default `7d` |
| `COOKIE_SAMESITE` | no | `none` for cross-site Vercel↔Render (default), `lax` for same-site |
| `FRONTEND_URL` | yes | Allowed CORS origin(s), comma-separated |
| `API_PUBLIC_URL` | no | Absolute API origin for local upload URLs; usually empty |
| `COLLEGE_EMAIL_DOMAINS` | no | e.g. `college.edu,university.edu`; empty accepts any domain |
| `CLOUDINARY_CLOUD_NAME` | production | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | production | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | production | Cloudinary API secret |
| `CLOUDINARY_FOLDER` | no | Upload folder, default `campus-cart` |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` | no | SMTP for verification emails. Set all to enforce verification |
| `EMAIL_FROM` | no | From address for verification emails |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | Admin created by the seed script |
| `SEED_DEMO_DATA` | no | `false` disables demo seed on in-memory startup |

### `frontend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | production | Full API base, e.g. `https://campus-cart-api.onrender.com/api`. Empty uses the dev proxy. |

> ⚠️ Never put MongoDB, JWT, Cloudinary or SMTP secrets in any `VITE_*` variable — Vite inlines them into the browser bundle.

---

## MongoDB Atlas setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com) → **Database Access** → add a user with `readWrite` on the database.
2. **Network Access** → allow your backend host. For Render use `0.0.0.0/0` (with a strong password) or Render's static outbound IPs.
3. **Connect → Drivers** → copy the SRV string and add the database name:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/campus_cart?retryWrites=true&w=majority`
4. Put it in `MONGO_URI`. Start the API — Mongoose creates collections and indexes on first use. `GET /api/health` should report `"database": "connected"`.

---

## Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com) → Dashboard.
2. Copy **Cloud name**, **API Key** and **API Secret** into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. Product images are uploaded to the `campus-cart` folder (configurable), and only the secure URL + public ID are stored in MongoDB. Updating or deleting a listing destroys the old assets.
4. Verify: create a listing with a photo, open the image URL (it should start with `https://res.cloudinary.com/...`), then delete the listing and confirm the asset is gone from the Cloudinary media library.

If Cloudinary is not configured, uploads are written to `backend/uploads` and served by Express. That fallback is **development only** — serverless/ephemeral hosts will lose those files.

---

## Testing

Backend integration tests run against a real MongoDB instance (in-memory) through the full Express stack.

```bash
cd backend
npm test
```

Result on this build:

```
Test Files  5 passed (5)
     Tests  32 passed (32)
  Duration  ~28s
```

Coverage:

- **Auth (7):** registration, duplicate email, input validation, invalid credentials, session restore, logout, protected routes, public profile privacy, invalid verification token.
- **Products (10):** create with image, upload validation, search by title/description, category/price/condition filters, sorting, pagination, details + related, owner-only edit/delete/status, sold listings hidden, listing deletion, filter metadata.
- **Wishlist (4):** add, duplicate prevention, remove, per-user privacy, auth required, unknown product.
- **Messaging (5):** send, inbox/sent grouping, conversation access and read receipts, unauthorized access, empty/self/unknown-recipient validation.
- **Dashboard & admin (5):** live counts scoped to the signed-in student, my-listings isolation, admin authorization, stats/users/listings, suspension, listing removal, self-suspension guard.

Manual end-to-end checks performed against the running app: register → login → session restore → upload listing with image → search/filter → wishlist → message seller → reply → mark sold → dashboard counts → admin moderation.

---

## Deployment

### Backend → Render

1. Push the repository to GitHub and create a **New Web Service** on Render.
2. Root directory: `backend` · Build: `npm install` · Start: `npm start` · Health check path: `/api/health`.
3. Add environment variables: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL=https://your-frontend.vercel.app`, `COOKIE_SAMESITE=none`, `CLOUDINARY_*`, optional `EMAIL_*`, `ADMIN_*`.
4. Deploy, then open `https://<service>.onrender.com/api/health` and confirm `database: connected`.
5. Seed the admin account once (Render Shell): `npm run seed`.

### Frontend → Vercel

1. Import the repository, set **Root Directory** to `frontend`, framework preset **Vite**.
2. Build command `npm run build`, output directory `dist` (already configured in `vercel.json`, which also rewrites all routes to `index.html` for SPA refreshes).
3. Environment variable `VITE_API_URL=https://<service>.onrender.com/api`.
4. Deploy, then register, log in, list an item with an image, search for it, save it, and message the seller.

### Frontend → Netlify (alternative)

`netlify.toml` is included. Base directory `frontend`, build `npm run build`, publish `dist`, and set the same `VITE_API_URL`.

### Post-deployment checklist

- [ ] `GET /api/health` returns 200 and `database: connected`
- [ ] Register a new account and log in
- [ ] Refresh the page — session persists
- [ ] Upload a listing with 2+ images and confirm Cloudinary URLs
- [ ] Search, filter, sort and paginate
- [ ] Add to wishlist, refresh, still saved
- [ ] Contact the seller and reply from the seller account
- [ ] Mark sold — disappears from the marketplace
- [ ] Delete a listing — Cloudinary assets removed
- [ ] Admin console loads for the seeded admin, 403 for students

> Deployment is only claimed once these steps pass on the deployed URLs. No live deployment was performed from this workspace because deployment credentials (Atlas, Cloudinary, Render/Vercel) were not provided.

---

## Screenshots

Add real captures after your first run (suggested files in `docs/screenshots/`):

| Screen | File |
| --- | --- |
| Home page hero & categories | `docs/screenshots/home.png` |
| Browse with filters | `docs/screenshots/browse.png` |
| Product details with gallery | `docs/screenshots/product-details.png` |
| Sell an item form | `docs/screenshots/sell.png` |
| Dashboard | `docs/screenshots/dashboard.png` |
| Messages / conversation | `docs/screenshots/messages.png` |
| Admin console | `docs/screenshots/admin.png` |

---

## Demo data

Created by `npm run seed` (or automatically on an in-memory dev database):

| Role | Email | Password |
| --- | --- | --- |
| Student | `aarav@campus.edu` | `Student@123` |
| Student | `priya@campus.edu` | `Student@123` |
| Student | `rohan@campus.edu` | `Student@123` |
| Student | `sneha@campus.edu` | `Student@123` |
| Admin | `admin@campus.edu` | `Admin@12345` |

Demo listings include the Engineering Mathematics textbook (₹250), Casio calculator (₹650), HP laptop (₹18,000), college bicycle (₹2,500), hostel study table (₹900), CLRS reference book (₹300), Bluetooth headphones (₹750, sold), drawing instruments kit (₹400), sports kit bag and an ergonomic chair. Seed data is for development only; user-created listings are always stored in MongoDB and rendered dynamically.

---

## Future enhancements

- Real-time chat with Socket.IO and typing indicators.
- In-app notifications for price drops, replies and moderation actions.
- Razorpay/UPI payments with escrow or deposit support.
- Advanced moderation: report listing/student, image auto-tagging, strike system.
- College-specific subdomains with per-campus admins and SSO.
- Saved searches and "notify me" alerts.
- Ratings and reviews after a completed exchange.
- Product image compression/CDN transforms and blurhash placeholders.
- Full TypeScript migration, OpenAPI spec and CI pipeline.
- Accessibility audit (WCAG 2.1 AA) and i18n for regional languages.

---

## Known limitations

- **No credentials supplied in this workspace:** MongoDB Atlas, Cloudinary and SMTP are unconfigured. The integrations are complete, but production image URLs, persistent Atlas data and verification emails require the variables above. Without Cloudinary, uploads go to local disk (development only). Without SMTP, accounts remain `isVerified: false` and login is intentionally not blocked — no email verification is ever claimed.
- Development without `MONGO_URI` uses a disposable in-memory MongoDB; data resets when the API restarts.
- Messaging is request-based (no WebSocket live updates); the navbar unread badge refreshes on navigation and every 60 seconds.
- Image validation trusts MIME type and extension; deep binary signature inspection is a future hardening step.
- No payment processing — transactions happen in person, as described in the Terms.
- No email change, account deletion or password-reset flow yet.
- Automated tests cover backend APIs; the React UI is verified through the production build and manual end-to-end flows, not a browser test suite.
- Dark mode is not included (light theme only, as specified).

---

© 2026 CAMPUS CART. Built for students, by students.
