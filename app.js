const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize a counter to track request numbers
let requestCount = 0;

// Strict Rate Limiter: Max 5 requests per minute globally
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, 
  message: { error: 'rateLimited_429', message: 'Too many requests, please slow down.' },
  standardHeaders: true, 
  legacyHeaders: false, 
  keyGenerator: (req, res) => 'webinar_global_limit' // Forces a global 5-request limit
});

app.set('trust proxy', 1);

// Parses incoming JSON payloads so we can extract the names
app.use(express.json());

// --- NEW ADVANCED LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
    requestCount++;
    const currentReqNum = requestCount;

    // Safely extract the full name from the Make webhook payload
    const firstName = req.body.firstname || 'Unknown';
    const lastName = req.body.lastname || 'Lead';
    const fullName = `${firstName} ${lastName}`;

    // Hook into the 'finish' event to capture the final HTTP status code
    res.on('finish', () => {
        const status = res.statusCode;
        
        if (status === 429) {
            console.log(`[REQ #${currentReqNum}] ❌ BLOCKED  | Status: ${status} | Lead: ${fullName}`);
        } else {
            console.log(`[REQ #${currentReqNum}] ✅ SUCCESS  | Status: ${status} | Lead: ${fullName}`);
        }
    });

    next();
});

// Main endpoint to attack
app.post('/api/v1/leads', limiter, (req, res) => {
    // Simulate slight processing time
    setTimeout(() => {
        res.status(200).json({ status: 'success', processedAt: new Date() });
    }, 200);
});

app.listen(PORT, () => {
    console.log(`Webinar Rate Limiter API running on port ${PORT}`);
    console.log(`Strict limit enforced: 5 requests per minute.`);
});