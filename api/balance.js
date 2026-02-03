function checkAuth(req, res) {
    if (req.headers["x-proxy-secret"] !== process.env.PROXY_SECRET) {
        res.status(403).json({ error: "Unauthorized" });
        return false;
    }
    return true;
}

export default async function handler(req, res) {
    if (!checkAuth(req, res)) return;
    if (req.method !== "POST")
        return res.status(405).json({ error: "Only POST allowed" });

    try {
        const response = await fetch(process.env.SMM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                key: process.env.SMM_API_KEY,
                action: "balance",
            }),
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Balance check failed" });
    }
}
