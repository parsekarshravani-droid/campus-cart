import { body, param, query } from 'express-validator';
import { CATEGORIES, CONDITIONS, STATUSES } from '../models/Product.js';

const collegeDomains = () =>
  (process.env.COLLEGE_EMAIL_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Full name must be 2–80 characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .bail()
    .custom((email) => {
      const domains = collegeDomains();
      if (!domains.length) return true;
      const domain = email.toLowerCase().split('@')[1] || '';
      if (!domains.includes(domain)) {
        throw new Error(`Please register with a college email (${domains.map((d) => '@' + d).join(', ')}).`);
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain a letter.')
    .matches(/\d/)
    .withMessage('Password must contain a number.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match.');
    return true;
  }),
  body('college').trim().isLength({ min: 2, max: 120 }).withMessage('College name is required.'),
  body('department').trim().isLength({ min: 2, max: 80 }).withMessage('Department is required.'),
  body('year').trim().isLength({ min: 1, max: 20 }).withMessage('Year of study is required.'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s()]{6,20}$/)
    .withMessage('Enter a valid phone number.'),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('password').isLength({ min: 1 }).withMessage('Password is required.'),
];

export const verifyEmailRules = [body('token').trim().isLength({ min: 20 }).withMessage('Invalid verification token.')];

export const profileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters.'),
  body('college').optional().trim().isLength({ min: 2, max: 120 }),
  body('department').optional().trim().isLength({ min: 2, max: 80 }),
  body('year').optional().trim().isLength({ min: 1, max: 20 }),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s()]{6,20}$/)
    .withMessage('Enter a valid phone number.'),
  body('profileImage').optional({ values: 'falsy' }).trim().isURL().withMessage('Profile image must be a URL.'),
];

export const productRules = [
  body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3–120 characters.'),
  body('description').trim().isLength({ min: 10, max: 4000 }).withMessage('Description must be 10–4000 characters.'),
  body('category').isIn(CATEGORIES).withMessage('Choose a valid category.'),
  body('price').isFloat({ min: 0, max: 10000000 }).withMessage('Enter a valid price.').toFloat(),
  body('originalPrice')
    .optional({ values: 'null' })
    .isFloat({ min: 0, max: 10000000 })
    .withMessage('Enter a valid original price.')
    .toFloat(),
  body('condition').isIn(CONDITIONS).withMessage('Choose a valid condition.'),
  body('location').trim().isLength({ min: 2, max: 120 }).withMessage('Pickup location is required.'),
  body('college').optional().trim().isLength({ min: 2, max: 120 }),
  body('status').optional().isIn(['available', 'sold']).withMessage('Invalid status.'),
];

export const productQueryRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 48 }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('sort').optional().isIn(['newest', 'oldest', 'price-asc', 'price-desc', 'popular']),
  query('category').optional().isIn(CATEGORIES),
  query('condition').optional().isIn(CONDITIONS),
  query('status').optional().isIn(STATUSES),
];

export const productIdRules = [param('id').isMongoId().withMessage('Invalid product id.')];
export const userIdRules = [param('userId').isMongoId().withMessage('Invalid user id.')];
export const statusRules = [body('status').isIn(STATUSES).withMessage('Invalid status.')];

export const messageRules = [
  body('receiver').isMongoId().withMessage('A valid seller is required.'),
  body('product').isMongoId().withMessage('A valid product is required.'),
  body('message').trim().isLength({ min: 2, max: 1200 }).withMessage('Write a message of at least 2 characters.'),
];

export const mongoIdRules = [param('id').isMongoId().withMessage('Invalid id.')];
