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

// ─── Cache to avoid hammering APIs ───
const quoteCache = new Map();
const CACHE_TTL = 30_000; // 30 seconds
const FX_CACHE_TTL = 300_000; // 5 minutes for exchange rate

function getCached(key, ttl = CACHE_TTL) {
    const entry = quoteCache.get(key);
    if (entry && Date.now() - entry.ts < ttl) return entry.data;
    return null;
}
function setCache(key, data) {
    quoteCache.set(key, { data, ts: Date.now() });
}

// ─── Helper: fetch live USD/EGP rate ───
// Removed as per user request

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

// ─── GET /api/indices — live market indices (US + Egyptian) ───
app.get("/api/indices", async (req, res) => {
    try {
        const cached = getCached("indices");
        if (cached) return res.json(cached);

        const indexSymbols = ["^EGX30", "^GSPC", "^IXIC", "^DJI", "^VIX", "^TNX", "GC=F"];
        const results = await Promise.allSettled(
            indexSymbols.map(sym => withRetry(() => yahooFinance.quote(sym)))
        );

        const nameMap = {
            "^EGX30": "EGX30", "^GSPC": "SPX", "^IXIC": "NDX", "^DJI": "DJI",
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

// ─── GET /api/gold-egypt — gold prices in EGP (24K/21K/18K per gram) ───
app.get("/api/gold-egypt", async (req, res) => {
    try {
        const cached = getCached("gold_egypt");
        if (cached) return res.json(cached);

        // Fetch global gold & silver from Yahoo (USD per troy ounce)
        const [goldResult, silverResult] = await Promise.allSettled([
            withRetry(() => yahooFinance.quote("GC=F")),
            withRetry(() => yahooFinance.quote("SI=F")),
        ]);

        const goldUsdOz = goldResult.status === "fulfilled" ? (goldResult.value?.regularMarketPrice ?? 0) : 0;
        const silverUsdOz = silverResult.status === "fulfilled" ? (silverResult.value?.regularMarketPrice ?? 0) : 0;
        const goldChange = goldResult.status === "fulfilled" ? (goldResult.value?.regularMarketChangePercent ?? 0) : 0;
        const silverChange = silverResult.status === "fulfilled" ? (silverResult.value?.regularMarketChangePercent ?? 0) : 0;

        const egpRate = await getEgpRate();

        // 1 troy ounce = 31.1035 grams
        const goldEgpPerGram24 = (goldUsdOz * egpRate) / 31.1035;
        const goldEgpPerGram21 = goldEgpPerGram24 * (21 / 24);
        const goldEgpPerGram18 = goldEgpPerGram24 * (18 / 24);
        const silverEgpPerGram = (silverUsdOz * egpRate) / 31.1035;

        const data = {
            gold: {
                usdPerOz: goldUsdOz,
                egpRate,
                change: goldChange,
                karats: {
                    "24K": { perGram: Math.round(goldEgpPerGram24 * 100) / 100, label: "عيار 24" },
                    "21K": { perGram: Math.round(goldEgpPerGram21 * 100) / 100, label: "عيار 21" },
                    "18K": { perGram: Math.round(goldEgpPerGram18 * 100) / 100, label: "عيار 18" },
                },
            },
            silver: {
                usdPerOz: silverUsdOz,
                egpPerGram: Math.round(silverEgpPerGram * 100) / 100,
                change: silverChange,
                label: "فضة",
            },
            ts: Date.now(),
        };

        setCache("gold_egypt", data);
        res.json(data);
    } catch (err) {
        console.error("Gold Egypt error:", err.message);
        res.status(500).json({ error: "Failed to fetch gold prices" });
    }
});

// ─── GET /api/commodities — key commodities with EGP conversion ───
app.get("/api/commodities", async (req, res) => {
    try {
        const cached = getCached("commodities");
        if (cached) return res.json(cached);

        const comSymbols = ["CL=F", "NG=F", "SI=F", "HG=F"];
        const nameMap = { "CL=F": "النفط (برنت)", "NG=F": "الغاز الطبيعي", "SI=F": "الفضة", "HG=F": "النحاس" };
        const unitMap = { "CL=F": "برميل", "NG=F": "MMBtu", "SI=F": "أوقية", "HG=F": "رطل" };

        const results = await Promise.allSettled(
            comSymbols.map(sym => withRetry(() => yahooFinance.quote(sym)))
        );
        const egpRate = await getEgpRate();

        const commodities = results.map((r, i) => {
            if (r.status === "fulfilled" && r.value) {
                const q = r.value;
                return {
                    symbol: comSymbols[i],
                    name: nameMap[comSymbols[i]],
                    unit: unitMap[comSymbols[i]],
                    priceUsd: q.regularMarketPrice ?? 0,
                    priceEgp: Math.round((q.regularMarketPrice ?? 0) * egpRate * 100) / 100,
                    change: q.regularMarketChangePercent ?? 0,
                };
            }
            return { symbol: comSymbols[i], name: nameMap[comSymbols[i]], unit: unitMap[comSymbols[i]], priceUsd: 0, priceEgp: 0, change: 0 };
        });

        const data = { commodities, egpRate, ts: Date.now() };
        setCache("commodities", data);
        res.json(data);
    } catch (err) {
        console.error("Commodities error:", err.message);
        res.status(500).json({ error: "Failed to fetch commodities" });
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
app.get("/{*splat}", (req, res) => {
    res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
    console.log(`✅ Mustaneer server running on port ${PORT}`);
});
