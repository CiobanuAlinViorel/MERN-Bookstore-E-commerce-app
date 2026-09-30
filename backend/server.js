require("dotenv").config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
 
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET lipsește din .env');
 
const app = express();
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// !!! Webhook-ul Stripe TREBUIE înaintea express.json(): are nevoie de body-ul brut pentru verificarea semnăturii
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  require('./src/features/orders/controllers/webhookController').stripe
);

app.use(express.json({ limit: '10kb' }));


// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/books', require('./src/features/products/routes/index'));
app.use('/api/auth', require('./src/features/auth/routes/index'));
app.use('/api/cart', require('./src/features/cart/routes/index'));
app.use('/api/orders', require('./src/features/orders/routes/index'));


// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection error:', err);
    process.exit(1);
  });