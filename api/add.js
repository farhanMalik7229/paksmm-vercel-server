function checkAuth(req, res) {
    if (req.headers["x-proxy-secret"] !== process.env.PROXY_SECRET) {
        res.status(403).json({ error: "Unauthorized" });
        return false;
    }
    return true;
}

export default async function handler(req, res) {
    if (!checkAuth(req, res)) return;
    if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

    try {
        const { service, link, quantity, comments, runs, interval } = req.body;

        if (!service || !link || !quantity) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        // Build URLSearchParams exactly as PakFollowers expects
        const params = new URLSearchParams();
        params.append("key", process.env.SMM_API_KEY);
        params.append("action", "add");
        params.append("service", service.toString());
        params.append("link", link);
        params.append("quantity", quantity.toString());

        if (comments) params.append("comments", Array.isArray(comments) ? comments.join("|") : comments);
        if (runs) params.append("runs", runs.toString());
        if (interval) params.append("interval", interval.toString());

        const response = await fetch(process.env.SMM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
        });

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({ error: "Add order failed", details: error.message });
    }
}
