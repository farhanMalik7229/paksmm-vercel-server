
// Your API Key for testing 

// const SMM_API_KEY = "b2a7d25c3854edfce7073d6f4c5cce0291d54a0e";

// PakFollowers API URL

// const SMM_API_URL = "https://pakfollowers.com/api/v2";


// Exported handler (for Vercel or local testing)

// export default async function handler(req, res) {

// Only POST requests

// if (req.method !== "POST") {
//     return res.status(405).json({ error: "Only POST allowed" });
// }

// try {
// Send request to PakFollowers API

//         const response = await fetch(SMM_API_URL, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded",
//             },
//             body: new URLSearchParams({
//                 key: SMM_API_KEY,
//                 action: "services",
//             }),
//         });

//         const data = await response.json();
//         res.status(200).json(data);

//     } catch (error) {
//         console.error("Error fetching services:", error);
//         res.status(500).json({ error: "Failed to fetch services" });
//     }
// }


//  with deployment verscel 

// api/services.js

export default async function handler(req, res) {
    // Allow only POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST requests allowed" });
    }

    try {
        // 🔐 Check Proxy Secret
        const clientSecret = req.headers["x-proxy-secret"];
        const serverSecret = process.env.PROXY_SECRET;

        // if (!clientSecret || clientSecret !== serverSecret) {
        //     return res.status(403).json({ error: "Unauthorized access" });
        // }

        // 🌐 Third-party API details from environment variables
        const SMM_API_URL = process.env.SMM_API_URL;
        const SMM_API_KEY = process.env.SMM_API_KEY;

        if (!SMM_API_URL || !SMM_API_KEY) {
            return res.status(500).json({ error: "Server configuration error" });
        }

        // 📡 Send request to PakFollowers API
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

        const data = await response.json();

        // ✅ Return response to client
        return res.status(200).json(data);

    } catch (error) {
        console.error("Services API Error:", error);
        return res.status(500).json({
            error: "Failed to fetch services",
            details: error.message,
        });
    }
}
