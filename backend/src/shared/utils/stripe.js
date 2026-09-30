const Stripe = require('stripe');

let client;
// Client creat "lazy": la primul apel, nu la import (util și pentru teste, unde se poate mock-ui)
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY lipsește din .env');
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

module.exports = { getStripe };