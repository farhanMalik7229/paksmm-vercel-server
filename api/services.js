// api/services.js
// Fetches services from PakFollowers API and returns them to the client

/**
 * Check authentication header
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} - True if authenticated, false otherwise
 */
function checkAuth(req, res) {
    // Check if PROXY_SECRET is configured
    const serverSecret = process.env.PROXY_SECRET;

    if (!serverSecret) {
        console.warn("⚠️ PROXY_SECRET not set in environment variables - allowing request");
        return true; // Allow if not configured (development mode)
    }

    const clientSecret = req.headers["x-proxy-secret"];

    if (!clientSecret) {
        console.error("❌ No X-Proxy-Secret header provided");
        res.status(403).json({
            error: "Unauthorized",
            message: "Missing authentication header"
        });
        return false;
    }

    if (clientSecret !== serverSecret) {
        console.error("❌ Invalid X-Proxy-Secret header");
        res.status(403).json({
            error: "Unauthorized",
            message: "Invalid authentication credentials"
        });
        return false;
    }

    console.log("✅ Authentication successful");
    return true;
}

/**
 * Main handler function for the services endpoint
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export default async function handler(req, res) {
    console.log("📥 Incoming request:", {
        method: req.method,
        url: req.url,
        headers: Object.keys(req.headers)
    });

    // Only allow POST requests
    if (req.method !== "POST") {
        console.error("❌ Invalid method:", req.method);
        return res.status(405).json({
            error: "Method not allowed",
            message: "Only POST requests are allowed"
        });
    }

    // Check authentication
    if (!checkAuth(req, res)) {
        return; // Response already sent by checkAuth
    }

    try {
        // Get environment variables
        const SMM_API_URL = process.env.SMM_API_URL;
        const SMM_API_KEY = process.env.SMM_API_KEY;

        // Validate environment variables
        console.log("🔍 Checking environment variables...");

        if (!SMM_API_URL) {
            console.error("❌ SMM_API_URL not configured");
            return res.status(500).json({
                error: "Server configuration error",
                message: "SMM_API_URL environment variable is not set",
                hint: "Add SMM_API_URL in Vercel project settings"
            });
        }

        if (!SMM_API_KEY) {
            console.error("❌ SMM_API_KEY not configured");
            return res.status(500).json({
                error: "Server configuration error",
                message: "SMM_API_KEY environment variable is not set",
                hint: "Add SMM_API_KEY in Vercel project settings"
            });
        }

        console.log("✅ Environment variables validated");
        console.log("🌐 Fetching services from:", SMM_API_URL);

        // Prepare request body
        const requestBody = new URLSearchParams({
            key: SMM_API_KEY,
            action: "services",
        });

        console.log("📤 Sending request to PakFollowers API...");

        // Make request to PakFollowers API
        const response = await fetch(SMM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: requestBody.toString(),
        });

        console.log("📨 Received response:", {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        // Check if response is OK
        if (!response.ok) {
            console.error("❌ PakFollowers API returned error:", response.status);

            // Try to get error message from response
            let errorMessage = "Failed to fetch from PakFollowers API";
            try {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                errorMessage = errorText || errorMessage;
            } catch (e) {
                console.error("Could not read error response");
            }

            return res.status(response.status).json({
                error: "API request failed",
                message: errorMessage,
                status: response.status,
                statusText: response.statusText
            });
        }

        // Get response as text first (for better error handling)
        const responseText = await response.text();
        console.log("📄 Response length:", responseText.length, "characters");

        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
            console.log("✅ JSON parsed successfully");

            // Log data structure info
            if (Array.isArray(data)) {
                console.log("📊 Data type: Array, Length:", data.length);
            } else if (data && typeof data === 'object') {
                console.log("📊 Data type: Object, Keys:", Object.keys(data).join(", "));
                if (data.data && Array.isArray(data.data)) {
                    console.log("📊 Services count:", data.data.length);
                }
            }
        } catch (parseError) {
            console.error("❌ JSON parse error:", parseError.message);
            console.error("Response preview:", responseText.substring(0, 200));

            return res.status(500).json({
                error: "Invalid JSON response",
                message: "PakFollowers API returned invalid JSON",
                details: parseError.message,
                preview: responseText.substring(0, 200) + "..."
            });
        }

        // Validate data structure
        if (!data) {
            console.error("❌ No data received from API");
            return res.status(500).json({
                error: "No data received",
                message: "PakFollowers API returned empty response"
            });
        }

        // Check if it's an error response from PakFollowers
        if (data.error) {
            console.error("❌ PakFollowers API error:", data.error);
            return res.status(400).json({
                error: "PakFollowers API error",
                message: data.error,
                details: data
            });
        }

        console.log("✅ Services fetched successfully");

        // Return the data to client
        return res.status(200).json(data);

    } catch (error) {
        // Catch any unexpected errors
        console.error("💥 Unexpected error:", error);
        console.error("Error stack:", error.stack);

        return res.status(500).json({
            error: "Internal server error",
            message: "Failed to fetch services",
            details: error.message,
            // Only include stack trace in development
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
}