// Rulare: node scripts/createAdmin.js admin@shop.ro ParolaLunga123
// Adminul se creează doar de aici, niciodată prin /register.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/features/auth/models/User');

(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Utilizare: node scripts/createAdmin.js <email> <parola>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log('Utilizator existent promovat la admin.');
  } else {
    await User.create({ email, password, role: 'admin', name: 'Admin' });
    console.log('Admin creat.');
  }
  await mongoose.disconnect();
})();