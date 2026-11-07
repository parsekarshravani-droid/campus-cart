import { Link } from 'react-router-dom';
import { ShieldCheck, Scale } from 'lucide-react';

const PRIVACY = [
  {
    title: 'What we collect',
    body: 'When you register we store your name, college email, hashed password, college, department, year of study and an optional phone number. Listings, wishlist saves and messages are stored in MongoDB so the marketplace can function.',
  },
  {
    title: 'How we use your data',
    body: 'Your email is used for sign-in and optional account verification. Your public profile shows only your name, college, department, year and profile photo. Email addresses and phone numbers are never shown publicly.',
  },
  {
    title: 'Messages',
    body: 'Buyer-to-seller conversations are stored so both participants can see their history. Only the two participants can read a conversation; administrators do not read messages except where required for abuse investigations.',
  },
  {
    title: 'Images and uploads',
    body: 'Product photos are uploaded to Cloudinary and their URLs and public IDs are stored with your listing. When a listing is edited or deleted, the associated images are removed from storage.',
  },
  {
    title: 'Cookies',
    body: 'Authentication uses a single httpOnly, secure cookie containing a signed JWT. It cannot be read by JavaScript. Signing out clears the cookie.',
  },
  {
    title: 'Your choices',
    body: 'You can edit your profile, delete listings, and clear your wishlist at any time. To delete your whole account, contact support@campuscart.app.',
  },
];

const TERMS = [
  {
    title: 'Marketplace, not a shop',
    body: 'CAMPUS CART connects students directly. We do not process payments, hold items in escrow or guarantee the condition of any item. Transactions happen in person between buyer and seller.',
  },
  {
    title: 'Who can use CAMPUS CART',
    body: 'Accounts are for students and campus community members. College email domains may be restricted by the deployment administrator. Do not create fake accounts or impersonate another student.',
  },
  {
    title: 'Listing rules',
    body: 'Only list items you own and are legally allowed to sell. Prohibited items include weapons, drugs, alcohol, tobacco, counterfeit goods, stolen property, live animals, academic ghostwriting services and anything illegal.',
  },
  {
    title: 'Honest listings',
    body: 'Use real photographs of the actual item and describe condition accurately. Prices must be in Indian Rupees. Mark items as sold once they are no longer available.',
  },
  {
    title: 'Meet safely',
    body: 'Meet in a public place on campus, inspect items before paying, and never share OTPs, bank details or passwords. Report suspicious behaviour to your campus admin.',
  },
  {
    title: 'Moderation',
    body: 'Administrators may remove listings that break these rules and suspend accounts involved in scams, harassment or prohibited sales. Serious cases may be reported to campus authorities.',
  },
];

export default function Legal({ type = 'privacy' }) {
  const isPrivacy = type === 'privacy';
  const sections = isPrivacy ? PRIVACY : TERMS;
  const Icon = isPrivacy ? ShieldCheck : Scale;
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';

  return (
    <div className="page">
      <div className="container page--narrow">
        <span className="eyebrow">
          <Icon size={13} /> Legal
        </span>
        <h1 style={{ marginTop: 14 }}>{title}</h1>
        <p className="muted">Last updated 1 January 2026</p>

        <div className="prose card card--pad" style={{ marginTop: 20 }}>
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <p className="small muted">
            Questions? Email <a href="mailto:support@campuscart.app">support@campuscart.app</a> or read our{' '}
            <Link to={isPrivacy ? '/terms' : '/privacy'}>{isPrivacy ? 'Terms & Conditions' : 'Privacy Policy'}</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
