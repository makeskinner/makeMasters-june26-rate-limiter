const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();

app.use(express.json());

// Set up the exact rate limit: Max 50 requests per minute
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 50, // Limit each IP to 50 requests per windowMs
    message: { error: "429 Too Many Requests: Rate limit exceeded" },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use((req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode === 429) {
            console.log(`[BLOCKED] 429 Rate Limit Exceeded for incoming request.`);
        }
    });
    next();
});

// Apply the rate limiter to our endpoint
app.post('/api/submit', apiLimiter, (req, res) => {
    // Simulate some processing time
    setTimeout(() => {
        res.status(200).json({ success: true, message: "Data received successfully", data: req.body });
    }, 200);
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Mock External API running on port ${PORT}`);
    console.log(`Strict limit enforced: 50 requests per minute.`);
});