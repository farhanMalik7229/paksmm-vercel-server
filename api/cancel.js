function checkAuth(req, res) {
    if (req.headers["x-proxy-secret"] !== process.env.PROXY_SECRET) {
        res.status(403).json({ error: "Unauthorized" });
        return false;
    }
    return true;
}

export default async function handler(req, res) {
    if (!checkAuth(req, res)) return;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }

    // try {
    //     const { order } = req.body;

    //     if (!order) {
    //         return res.status(400).json({ error: "Missing required parameter: order" });
    //     }

    //     // const orderId = Number(order);
    //     if (isNaN(order)) {
    //         return res.status(400).json({ error: "Order must be a valid number" });
    //     }

    //     // 🔥 Safety checks for environment variables
    //     if (!process.env.SMM_API_URL) {
    //         return res.status(500).json({ error: "SMM_API_URL not defined" });
    //     }

    //     if (!process.env.SMM_API_KEY) {
    //         return res.status(500).json({ error: "SMM_API_KEY not defined" });
    //     }

    //     // Build request
    //     const params = new URLSearchParams();
    //     params.append("key", process.env.SMM_API_KEY);
    //     params.append("action", "cancel");
    //     params.append("order", orderId.toString());

    //     const response = await fetch(process.env.SMM_API_URL, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/x-www-form-urlencoded"
    //         },
    //         body: params.toString()
    //     });

    //     // Read raw text first
    //     const rawText = await response.text();

    //     // Try parsing JSON safely
    //     let data;
    //     try {
    //         data = JSON.parse(rawText);
    //     } catch (err) {
    //         console.error("Invalid JSON from SMM:", rawText);
    //         return res.status(500).json({
    //             error: "SMM API returned invalid JSON",
    //             rawResponse: rawText
    //         });
    //     }

    //     // If SMM returns error status
    //     if (!response.ok) {
    //         return res.status(response.status).json(data);
    //     }

    //     return res.status(200).json(data);

    // } catch (error) {
    //     console.error("Cancel API Crash:", error);
    //     return res.status(500).json({
    //         error: "Cancel order failed",
    //         details: error.message
    //     });
    // }

    try {
        const response = await fetch(process.env.SMM_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                key: process.env.SMM_API_KEY,
                action: "cancel",
                order,
            }),
        });

        res.status(200).json(await response.json());
    } catch {
        res.status(500).json({ error: "Status check failed" });
    }
}
