const https = require('https');
const http = require('http');

const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
const makeApiKey = process.env.MAKE_API_KEY; 
const concurrentRequests = 350;

// Bypasses Node's default connection pool limits to guarantee a thundering herd
const agent = new https.Agent({ maxSockets: Infinity });

async function blastWebhook() {
    console.log(`[ALERT] Webinar Triggered! Blasting ${concurrentRequests} concurrent requests...`);
    
    const urlObj = new URL(makeWebhookUrl);
    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        agent: agent,
        headers: { 
            'Content-Type': 'application/json',
            'x-make-apikey': makeApiKey 
        }
    };

    const requests = Array.from({ length: concurrentRequests }).map((_, index) => {
        return new Promise((resolve) => {
            const req = https.request(options, (res) => {
                console.log(`Request ${index}: Status ${res.statusCode}`);
                resolve();
            });

            req.on('error', (err) => {
                console.error(`Request ${index} failed:`, err.message);
                resolve();
            });

            // Send the payload
            req.write(JSON.stringify({ eventId: index, timestamp: new Date() }));
            req.end();
        });
    });

    await Promise.all(requests);
    console.log("Load test complete.");
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/trigger-blast') {
        blastWebhook();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Load test initiated successfully!" }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Not Found" }));
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is live and listening on port ${PORT}`);
});