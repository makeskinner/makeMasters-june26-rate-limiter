const http = require('http');

const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
const makeApiKey = process.env.MAKE_API_KEY; 
const concurrentRequests = 350;

async function blastWebhook() {
    console.log(`[ALERT] Webinar Triggered! Blasting ${concurrentRequests} concurrent requests...`);
    
    // Object to collate our results
    const summary = {
        totalSent: concurrentRequests,
        success_200: 0,
        rateLimited_429: 0,
        otherErrors: 0
    };

    // Create the array of fetch promises
    const requests = Array.from({ length: concurrentRequests }).map((_, index) => {
        return fetch(makeWebhookUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-make-apikey': makeApiKey || '' 
            },
            body: JSON.stringify({ eventId: index, timestamp: new Date() })
        })
        .then(res => {
            if (res.status === 200) {
                summary.success_200++;
            } else if (res.status === 429) {
                summary.rateLimited_429++;
            } else {
                summary.otherErrors++;
            }
        })
        .catch(err => {
            summary.otherErrors++;
        });
    });

    // Wait for all 350 requests to completely finish
    await Promise.all(requests);
    console.log("Load test complete. Results:", summary);
    
    return summary;
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/trigger-blast') {
        // Await the blast so we get the completed metrics back
        const metrics = await blastWebhook();
        
        // Return the clean summary directly to the client (Make)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: "complete", 
            results: metrics 
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Not Found" }));
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is live and listening on port ${PORT}`);
});