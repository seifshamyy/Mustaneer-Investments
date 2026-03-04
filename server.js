import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ─── Serve Vite production build if exists ───
app.use(express.static(join(__dirname, "dist")));

// ─── Cache to avoid hammering Yahoo ───
const quoteCache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(key) {
    const entry = quoteCache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
    return null;
}
function setCache(key, data) {
    quoteCache.set(key, { data, ts: Date.now() });
}

// ─── Retry helper for Yahoo (cloud IPs get rate-limited) ───
async function withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            console.warn(`Retry ${i + 1}/${retries}: ${err.message}`);
            await new Promise(r => setTimeout(r, delay * (i + 1)));
        }
    }
}

// ─── GET /api/quotes?symbols=AAPL,MSFT,NVDA ───
app.get("/api/quotes", async (req, res) => {
    try {
        const symbols = (req.query.symbols || "").split(",").filter(Boolean);
        if (!symbols.length) return res.json([]);

        const cacheKey = symbols.sort().join(",");
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const results = await Promise.allSettled(
            symbols.map(sym => withRetry(() => yahooFinance.quote(sym)))
        );

        const quotes = results.map((r, i) => {
            if (r.status === "fulfilled" && r.value) {
                const q = r.value;
                return {
                    symbol: q.symbol,
                    price: q.regularMarketPrice ?? 0,
                    previousClose: q.regularMarketPreviousClose ?? 0,
                    change: q.regularMarketChange ?? 0,
                    changePercent: q.regularMarketChangePercent ?? 0,
                    dayHigh: q.regularMarketDayHigh ?? 0,
                    dayLow: q.regularMarketDayLow ?? 0,
                    volume: q.regularMarketVolume ?? 0,
                    marketCap: q.marketCap ?? 0,
                    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
                    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
                    name: q.shortName || q.longName || symbols[i],
                };
            }
            return { symbol: symbols[i], price: 0, error: r.reason?.message || "Failed to fetch" };
        });

        setCache(cacheKey, quotes);
        res.json(quotes);
    } catch (err) {
        console.error("Quotes error:", err.message);
        res.status(500).json({ error: "Failed to fetch quotes" });
    }
});

// ─── GET /api/history?symbol=AAPL&range=1mo ───
app.get("/api/history", async (req, res) => {
    try {
        const { symbol, range = "1mo" } = req.query;
        if (!symbol) return res.status(400).json({ error: "symbol required" });

        const cacheKey = `hist_${symbol}_${range}`;
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const periodMap = { "1w": 7, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365 };
        const days = periodMap[range] || 30;
        const now = new Date();
        const start = new Date(now.getTime() - days * 86400000);

        const result = await withRetry(() => yahooFinance.chart(symbol, {
            period1: start.toISOString().split("T")[0],
            period2: now.toISOString().split("T")[0],
            interval: days <= 30 ? "1d" : "1wk",
        }));

        const points = (result.quotes || []).map(q => ({
            date: q.date,
            close: q.close,
            high: q.high,
            low: q.low,
            open: q.open,
            volume: q.volume,
        })).filter(p => p.close != null);

        setCache(cacheKey, points);
        res.json(points);
    } catch (err) {
        console.error("History error:", err.message);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

// ─── GET /api/indices — live market indices ───
app.get("/api/indices", async (req, res) => {
    try {
        const cached = getCached("indices");
        if (cached) return res.json(cached);

        const indexSymbols = ["^GSPC", "^IXIC", "^DJI", "^VIX", "^TNX", "GC=F"];
        const results = await Promise.allSettled(
            indexSymbols.map(sym => withRetry(() => yahooFinance.quote(sym)))
        );

        const nameMap = {
            "^GSPC": "SPX", "^IXIC": "NDX", "^DJI": "DJI",
            "^VIX": "VIX", "^TNX": "US10Y", "GC=F": "GOLD"
        };

        const indices = results.map((r, i) => {
            if (r.status === "fulfilled" && r.value) {
                const q = r.value;
                return {
                    sym: nameMap[indexSymbols[i]] || q.symbol,
                    val: q.regularMarketPrice ?? 0,
                    change: q.regularMarketChangePercent ?? 0,
                };
            }
            return { sym: nameMap[indexSymbols[i]], val: 0, change: 0 };
        });

        setCache("indices", indices);
        res.json(indices);
    } catch (err) {
        console.error("Indices error:", err.message);
        res.status(500).json({ error: "Failed to fetch indices" });
    }
});

// ─── POST /api/chat — Claude AI proxy ───
app.post("/api/chat", async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set in .env" });
    }

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "anthropic-beta": "web-search-2025-03-05",
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ error: "Failed to contact Anthropic API." });
    }
});

// ─── SPA fallback: serve index.html for non-API routes ───
app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
    console.log(`✅ Mustaneer server running on port ${PORT}`);
});
