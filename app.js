const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Strict Rate Limiter: Max 5 requests per minute globally
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, 
  message: { error: 'rateLimited_429', message: 'Too many requests, please slow down.' },
  standardHeaders: true, 
  legacyHeaders: false,
  
  // This forces the limiter to ignore IP addresses and enforce the limit globally
  keyGenerator: (req, res) => 'webinar_global_limit' 
});

app.set('trust proxy', 1);

app.use(express.json());

// Main endpoint to attack
app.post('/api/v1/leads', limiter, (req, res) => {
  console.log(`Processing lead: ${req.body.firstname || 'Unknown'}`);
  res.status(200).json({ status: 'success', processedAt: new Date() });
});

app.listen(PORT, () => {
  console.log(`Rate limiter API running on port ${PORT}`);
});