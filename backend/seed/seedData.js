import User from '../models/User.js';
import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';
import Message from '../models/Message.js';

const img = (id) => ({
  url: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`,
  publicId: null,
  provider: 'cloudinary',
});

export const demoUsers = [
  {
    name: 'Aarav Mehta',
    email: 'aarav@campus.edu',
    password: 'Student@123',
    college: 'Atharva College Of Engineering',
    department: 'Computer Science',
    year: '3rd Year',
    phone: '9876543210',
    isVerified: true,
  },
  {
    name: 'Priya Sharma',
    email: 'priya@campus.edu',
    password: 'Student@123',
    college: 'Atharva College Of Engineering',
    department: 'Electronics',
    year: '2nd Year',
    phone: '9876500011',
    isVerified: true,
  },
  {
    name: 'Rohan Verma',
    email: 'rohan@campus.edu',
    password: 'Student@123',
    college: 'Atharva College Of Engineering',
    department: 'Mechanical',
    year: '4th Year',
    phone: '9876500022',
    isVerified: true,
  },
  {
    name: 'Sneha Iyer',
    email: 'sneha@campus.edu',
    password: 'Student@123',
    college: 'Thakur College of Engineering and Technology',
    department: 'Information Technology',
    year: '2nd Year',
    phone: '9876500033',
    isVerified: true,
  },
];

const demoProducts = [
  {
    title: 'Engineering Mathematics Textbook (B.S. Grewal)',
    description:
      'Higher Engineering Mathematics by B.S. Grewal, 44th edition. Used for one semester — all pages intact, a few pencil notes in the calculus chapters. Covers the entire first-year syllabus.',
    category: 'Books & Study Materials',
    price: 250,
    originalPrice: 795,
    condition: 'Good',
    location: 'Central Library Gate',
    images: [img('photo-1676302447092-14a103558511')],
    sellerEmail: 'aarav@campus.edu',
    status: 'available',
  },
  {
    title: 'Casio FX-991EX Scientific Calculator',
    description:
      'Casio ClassWiz FX-991EX with 552 functions. Perfect for engineering exams. Slide cover included, display is scratch-free and all keys respond perfectly.',
    category: 'Calculators',
    price: 650,
    originalPrice: 1595,
    condition: 'Like New',
    location: 'Block C Canteen',
    images: [img('photo-1648201637025-1c77b9be3013')],
    sellerEmail: 'priya@campus.edu',
    status: 'available',
  },
  {
    title: 'HP Pavilion 14 Laptop — i5, 8GB RAM, 512GB SSD',
    description:
      'Selling my trusty HP Pavilion 14 (2021). Intel i5 11th gen, 8GB RAM, 512GB SSD, backlit keyboard. Battery lasts around 5 hours. Comes with original charger and box. Upgrading to a new machine.',
    category: 'Electronics',
    price: 18000,
    originalPrice: 54990,
    condition: 'Good',
    location: 'Hostel B Reception',
    images: [img('photo-1517336714731-489689fd1ca8'), img('photo-1531346878377-a5be20888e57')],
    sellerEmail: 'rohan@campus.edu',
    status: 'available',
  },
  {
    title: 'Btwin MyBike College Bicycle',
    description:
      'Single-speed Btwin bicycle, ideal for campus commuting. Recently serviced with new brake pads and tubes. Slight paint wear on the frame, runs perfectly.',
    category: 'Bicycles',
    price: 2500,
    originalPrice: 8500,
    condition: 'Good',
    location: 'Sports Complex Parking',
    images: [img('photo-1485965120184-e220f721d03e')],
    sellerEmail: 'aarav@campus.edu',
    status: 'available',
  },
  {
    title: 'Hostel Study Table with Drawer',
    description:
      'Compact wooden study table (90 x 50 cm) with one drawer. Sturdy, no wobble. Great for hostel rooms — moving out of the hostel this month, so pickup only.',
    category: 'Furniture',
    price: 900,
    originalPrice: 2400,
    condition: 'Fair',
    location: 'Hostel D, Room 214',
    images: [img('photo-1679309981674-cef0e23a7864')],
    sellerEmail: 'sneha@campus.edu',
    status: 'available',
  },
  {
    title: 'Data Structures Reference Book — CLRS',
    description:
      'Introduction to Algorithms (CLRS), 3rd edition. The definitive reference for DSA. Hardcover in excellent condition, no highlighting or torn pages.',
    category: 'Books & Study Materials',
    price: 300,
    originalPrice: 1200,
    condition: 'Like New',
    location: 'Department of CSE, Room 302',
    images: [img('photo-1456513080510-7bf3a84b82f8')],
    sellerEmail: 'priya@campus.edu',
    status: 'available',
  },
  {
    title: 'Sony WH-CH510 Bluetooth Headphones',
    description:
      'Wireless over-ear headphones with ~30 hours of battery life. Lightweight and comfortable for long study sessions. Includes USB-C charging cable.',
    category: 'Electronics',
    price: 750,
    originalPrice: 2999,
    condition: 'Good',
    location: 'Main Auditorium Steps',
    images: [img('photo-1505740420928-5e560c06d30e'), img('photo-1583394838336-acd977736f90')],
    sellerEmail: 'rohan@campus.edu',
    status: 'sold',
  },
  {
    title: 'Drawing Instruments Kit (Engineering Graphics)',
    description:
      'Complete engineering drawing kit: compass, divider, set squares, protractor, mini drafter scale and a 0.5 mm clutch pencil. Used for one semester only.',
    category: 'Stationery',
    price: 400,
    originalPrice: 950,
    condition: 'Like New',
    location: 'Workshop Block',
    images: [img('photo-1603901622056-0a5bee231395')],
    sellerEmail: 'sneha@campus.edu',
    status: 'available',
  },
  {
    title: 'Nike Sports Kit Bag — 40L',
    description:
      'Nike duffel bag, 40 litres, used for gym and sports practice. Strong zips, separate shoe compartment, and a padded shoulder strap. Cleaned and ready.',
    category: 'Sports Equipment',
    price: 850,
    originalPrice: 2600,
    condition: 'Good',
    location: 'Sports Complex',
    images: [img('photo-1553062407-98eeb64c6a62')],
    sellerEmail: 'rohan@campus.edu',
    status: 'available',
  },
  {
    title: 'Ergonomic Study Chair',
    description:
      'Mesh-back ergonomic chair with adjustable height and armrests. Bought last year, extremely comfortable for long coding sessions. Pickup from Girls Hostel common room.',
    category: 'Furniture',
    price: 2200,
    originalPrice: 6500,
    condition: 'Like New',
    location: 'Girls Hostel Common Room',
    images: [img('photo-1503602642458-232111445657')],
    sellerEmail: 'sneha@campus.edu',
    status: 'available',
  },
];

/**
 * Insert demo marketplace data. Safe to run repeatedly:
 * without `reset` it only seeds an empty database.
 * Never call this against a production database you care about.
 */
export async function seedDemoData({ reset = false, silent = false } = {}) {
  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  if (reset) {
    await Promise.all([Product.deleteMany({}), Wishlist.deleteMany({}), Message.deleteMany({})]);
    await User.deleteMany({ role: 'student' });
    log('[seed] Cleared products, wishlists, messages and student accounts.');
  }

  const existing = await Product.countDocuments();
  if (existing > 0 && !reset) {
    log(`[seed] Database already has ${existing} listings — skipping demo seed.`);
    return { skipped: true };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campus.edu').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'CAMPUS CART Admin',
      email: adminEmail,
      password: adminPassword,
      college: 'CAMPUS CART HQ',
      department: 'Moderation',
      year: '—',
      role: 'admin',
      isVerified: true,
    });
    log(`[seed] Admin account created: ${adminEmail}`);
  }

  const usersByEmail = new Map();
  for (const demo of demoUsers) {
    let user = await User.findOne({ email: demo.email });
    if (!user) user = await User.create({ ...demo, role: 'student' });
    usersByEmail.set(demo.email, user);
  }

  const created = [];
  for (const item of demoProducts) {
    const seller = usersByEmail.get(item.sellerEmail);
    const product = await Product.create({
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price,
      originalPrice: item.originalPrice,
      condition: item.condition,
      location: item.location,
      images: item.images,
      seller: seller._id,
      college: seller.college,
      status: item.status,
    });
    created.push(product);
  }

  // A couple of wishlist entries and one inquiry so the demo feels alive.
  const aarav = usersByEmail.get('aarav@campus.edu');
  const priya = usersByEmail.get('priya@campus.edu');
  const rohan = usersByEmail.get('rohan@campus.edu');

  if (aarav && created[1]) await Wishlist.updateOne({ user: aarav._id, product: created[1]._id }, { $setOnInsert: { user: aarav._id, product: created[1]._id } }, { upsert: true });
  if (priya && created[2]) await Wishlist.updateOne({ user: priya._id, product: created[2]._id }, { $setOnInsert: { user: priya._id, product: created[2]._id } }, { upsert: true });

  if (priya && rohan && created[2]) {
    await Message.create({
      sender: priya._id,
      receiver: rohan._id,
      product: created[2]._id,
      message: 'Hi Rohan! Is the laptop still available? Can you share the battery health report?',
    });
    await Message.create({
      sender: rohan._id,
      receiver: priya._id,
      product: created[2]._id,
      message: 'Hey Priya, yes it is available. Battery health is 84% — happy to meet near the library tomorrow.',
    });
  }

  log(`[seed] Seeded ${created.length} demo listings for ${usersByEmail.size} students.`);
  log('[seed] Demo login → aarav@campus.edu / Student@123');
  return { products: created.length, users: usersByEmail.size };
}
