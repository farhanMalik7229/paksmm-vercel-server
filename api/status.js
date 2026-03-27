function checkAuth(req, res) {
    if (req.headers["x-proxy-secret"] !== process.env.PROXY_SECRET) {
        res.status(403).json({ error: "Unauthorized" });
        return false;
    }
    return true;
}

export default async function handler(req, res) {
    if (!checkAuth(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

    const { order } = req.body;
    if (!order) return res.status(400).json({ error: "Order ID required" });

    try {
        const response = await fetch(process.env.SMM_API_URL, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" 
            },
            body: new URLSearchParams({
                key: process.env.SMM_API_KEY,
                action: "status",
                order,
            }),
        });

        const data = await response.json();
        
        // Explicitly extract and return start_count and remains counts
        res.status(200).json({
            ...data,
            start_count: data.start_count || 0,
            remains: data.remains || 0
        });
    } catch (e) {
        res.status(500).json({ error: "Status check failed", details: e.message });
    }
}
