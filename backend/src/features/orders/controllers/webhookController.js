const orderService = require('../services/orderService');
const { getStripe } = require('../../../shared/utils/stripe');

// IMPORTANT: ruta primește body-ul BRUT (Buffer), nu JSON parsat; vezi server.js
exports.stripe = async (req, res) => {
  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook invalid: ${err.message}`); // semnătură falsă/greșită
  }

  await orderService.handleStripeEvent(event); // dacă aruncă, răspunsul e 500 și Stripe reîncearcă
  res.json({ received: true });
};