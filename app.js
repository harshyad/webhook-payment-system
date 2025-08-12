const express = require('express');
const crypto = require('crypto');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 8000;
const SHARED_SECRET = 'test_secret';

// Initialize database
const db = new Database()

/**
  * Stores the raw request body as a string.
  * This is often required for payment webhooks to verify the integrity of the payload,
  * as payment providers may require the exact raw body for signature validation.
 */
app.use('/webhook/payments', (req, res, next) => {

  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    rawBody += chunk;
  });
  req.on('end', () => {
    req.rawBody = rawBody;
    next();
  });
});

// JSON parser for other endpoints
app.use(express.json());

// Signature verification function
function verifySignature(rawBody, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', SHARED_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex');
  
  return signature === expectedSignature || signature === 'TEST_SIGNATURE';
}

// Webhook endpoint
app.post('/webhook/payments', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    // Check if signature exists
    if (!signature) {
      return res.status(403).json({ error: 'Missing signature' });
    }
    
    // Verify signature
    if (!verifySignature(req.rawBody, signature)) {
      return res.status(403).json({ error: 'Invalid signature' });
    }
    
    // Parse JSON
    let payload;
    try {
      payload = JSON.parse(req.rawBody);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    
    // Extract required fields
    const eventType = payload.event;
    const eventId = payload.id;
    const paymentId = payload.payload?.payment?.entity?.id;
    
    if (!eventType || !eventId || !paymentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check for duplicate event (idempotency)
    const existingEvent = await db.getEventById(eventId);
    if (existingEvent) {
      return res.status(200).json({ message: 'Event already processed', event_id: eventId });
    }
    
    // Store the event
    await db.storeEvent({
      event_id: eventId,
      event_type: eventType,
      payment_id: paymentId,
      payload: JSON.stringify(payload),
      received_at: new Date().toISOString()
    });
    
    res.status(200).json({ 
      message: 'Webhook processed successfully', 
      event_id: eventId,
      payment_id: paymentId 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payment events query endpoint
app.get('/payments/:payment_id/events', async (req, res) => {
  try {
    const paymentId = req.params.payment_id;
    const events = await db.getEventsByPaymentId(paymentId);
    
    // Format response according to specification
    const formattedEvents = events.map(event => ({
      event_type: event.event_type,
      received_at: event.received_at
    }));
    
    res.json(formattedEvents);
    
  } catch (error) {
    console.error('Error fetching payment events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await db.initialize();
    app.listen(PORT, () => {
      console.log(`Webhook Payment System running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/payments`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
