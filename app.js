const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Strict Rate Limiter: Max 5 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, 
  message: { error: 'rateLimited_429', message: 'Too many requests, please slow down.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, 
});

app.use(express.json());

// Main endpoint to attack
app.post('/api/v1/leads', limiter, (req, res) => {
  console.log(`Processing lead: ${req.body.firstname || 'Unknown'}`);
  res.status(200).json({ status: 'success', processedAt: new Date() });
});

app.listen(PORT, () => {
  console.log(`Rate limiter API running on port ${PORT}`);
});