// api/services.js - FIXED VERSION

function checkAuth(req, res) {
    // ✅ Check if PROXY_SECRET is configured
    if (!process.env.PROXY_SECRET) {
        console.error("PROXY_SECRET not configured in environment variables");
        return true; // Allow if not configured (for testing)
    }

    const clientSecret = req.headers["x-proxy-secret"];

    if (!clientSecret || clientSecret !== process.env.PROXY_SECRET) {
        res.status(403).json({ error: "Unauthorized access" });
        return false;
    }

    return true;
}

export default async function handler(req, res) {
    // Allow only POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST requests allowed" });
    }

    // Check authentication
    if (!checkAuth(req, res)) return;

    try {
        // Get API credentials from environment variables
        const SMM_API_URL = process.env.SMM_API_URL;
        const SMM_API_KEY = process.env.SMM_API_KEY;

        // Validate environment variables
        if (!SMM_API_URL || !SMM_API_KEY) {
            console.error("Missing environment variables:", {
                SMM_API_URL: !!SMM_API_URL,
                SMM_API_KEY: !!SMM_API_KEY
            });
            return res.status(500).json({
                error: "Server configuration error",
                details: "SMM_API_URL or SMM_API_KEY not configured"
            });
        }

        console.log("Fetching services from:", SMM_API_URL);

        // Send request to PakFollowers API
        const response = await fetch(SMM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                key: SMM_API_KEY,
                action: "services",
            }),
        });

        // Check if response is OK
        if (!response.ok) {
            console.error("PakFollowers API error:", response.status, response.statusText);
            return res.status(response.status).json({
                error: "Failed to fetch from PakFollowers API",
                status: response.status,
                statusText: response.statusText
            });
        }

        // Get response text first for debugging
        const responseText = await response.text();

        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Response text:", responseText.substring(0, 500));
            return res.status(500).json({
                error: "Invalid JSON response from API",
                details: parseError.message,
                sample: responseText.substring(0, 200)
            });
        }

        // Log successful response
        console.log("Services fetched successfully:", Array.isArray(data) ? data.length : "unknown count");

        // Return response to client
        return res.status(200).json(data);

    } catch (error) {
        console.error("Services API Error:", error);
        return res.status(500).json({
            error: "Failed to fetch services",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}