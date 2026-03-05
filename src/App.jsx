import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const THEMES = {
  dark: {
    TEAL: "#A8C7FA", TEAL_LIGHT: "#C2E7FF", TEAL_DARK: "#004A77", EMERALD: "#7DCFB6",
    BG: "#111318", BG2: "#1B1D24", CARD: "#1E2128", CARD2: "#252830",
    BORDER: "#44474F", BORDER_LIGHT: "#5C5F67",
    TEXT: "#E3E2E6", TEXT_SEC: "#C4C6D0", TEXT_DIM: "#8E9099",
    RED: "#FFB4AB", GREEN: "#7DCFB6", WHITE: "#FFFFFF", AMBER: "#FFB951",
    PRIMARY: "#A8C7FA", ON_PRIMARY: "#003258", PRIMARY_CONTAINER: "#004A77",
    SURFACE_VARIANT: "#44474F", SHADOW: "rgba(0,0,0,0.4)",
  },
  light: {
    TEAL: "#0B57D0", TEAL_LIGHT: "#0842A0", TEAL_DARK: "#0B57D0", EMERALD: "#146C2E",
    BG: "#F8FAFB", BG2: "#EFF1F5", CARD: "#FFFFFF", CARD2: "#F3F6FC",
    BORDER: "#C4C7C5", BORDER_LIGHT: "#A8ABB0",
    TEXT: "#1F1F1F", TEXT_SEC: "#444746", TEXT_DIM: "#747775",
    RED: "#B3261E", GREEN: "#146C2E", WHITE: "#FFFFFF", AMBER: "#E37400",
    PRIMARY: "#0B57D0", ON_PRIMARY: "#FFFFFF", PRIMARY_CONTAINER: "#D3E3FD",
    SURFACE_VARIANT: "#E1E3E1", SHADOW: "rgba(0,0,0,0.1)",
  },
};

const LOGO_URL = "https://pub-caa62f1b5ec34522975fc2acc07b5053.r2.dev/Untitled%20design%20(7).png";
const LOGO_URL_DARK = "https://pub-caa62f1b5ec34522975fc2acc07b5053.r2.dev/Untitled%20design%20(9).png";
const CLAUDE_LOGO = "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png";

// Toast notification component (M3 Snackbar style)
const Toast = ({ toasts, onDismiss, t }) => (
  <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
    {toasts.map(toast => (
      <div key={toast.id} style={{
        background: toast.type === "error" ? t.RED : toast.type === "warning" ? t.AMBER : t.CARD2,
        borderRadius: 8, padding: "12px 16px", minWidth: 300, maxWidth: 480,
        display: "flex", gap: 12, alignItems: "center", animation: "mFadeIn 0.2s cubic-bezier(0.2, 0, 0, 1)",
        boxShadow: `0 6px 20px ${t.SHADOW}`, border: "none",
        color: toast.type === "error" || toast.type === "warning" ? "#FFFFFF" : t.TEXT,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 20, flexShrink: 0 }}>{toast.type === "error" ? "error" : toast.type === "warning" ? "warning" : "check_circle"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 1 }}>{toast.title}</div>
          <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>{toast.message}</div>
        </div>
        <button onClick={() => onDismiss(toast.id)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 18, padding: 4, opacity: 0.7, borderRadius: 20 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
        </button>
      </div>
    ))}
  </div>
);

const DEFAULT_PORTFOLIO = [
  { ticker: "AAPL", shares: 500, avgCost: 142.5, sector: "Technology" },
  { ticker: "MSFT", shares: 300, avgCost: 310.0, sector: "Technology" },
  { ticker: "NVDA", shares: 200, avgCost: 450.0, sector: "Technology" },
  { ticker: "JPM", shares: 400, avgCost: 155.0, sector: "Financials" },
  { ticker: "JNJ", shares: 250, avgCost: 162.0, sector: "Healthcare" },
  { ticker: "XOM", shares: 350, avgCost: 95.0, sector: "Energy" },
  { ticker: "PG", shares: 200, avgCost: 148.0, sector: "Consumer Staples" },
  { ticker: "AMZN", shares: 150, avgCost: 128.0, sector: "Technology" },
];

const EGYPTIAN_PORTFOLIO = [
  { ticker: "COMI.CA", shares: 1000, avgCost: 75.0, sector: "بنوك" },
  { ticker: "HRHO.CA", shares: 800, avgCost: 28.0, sector: "خدمات مالية" },
  { ticker: "SWDY.CA", shares: 500, avgCost: 42.0, sector: "صناعة" },
  { ticker: "TMGH.CA", shares: 2000, avgCost: 12.5, sector: "عقارات" },
  { ticker: "ETEL.CA", shares: 1500, avgCost: 25.0, sector: "اتصالات" },
  { ticker: "EFIH.CA", shares: 600, avgCost: 35.0, sector: "تكنولوجيا" },
  { ticker: "FWRY.CA", shares: 1000, avgCost: 5.5, sector: "تكنولوجيا" },
  { ticker: "PHDC.CA", shares: 3000, avgCost: 4.0, sector: "عقارات" },
];

const SECTORS = ["Technology", "Financials", "Healthcare", "Energy", "Consumer Staples", "Real Estate", "Industrials", "Utilities", "Materials", "Communication Services", "Consumer Discretionary", "بنوك", "خدمات مالية", "عقارات", "اتصالات", "صناعة", "تكنولوجيا", "أغذية", "أدوية"];

const SECTOR_COLORS = {
  Technology: "#2DD4BF", Financials: "#34D399", Healthcare: "#F59E0B", Energy: "#FB923C",
  "Consumer Staples": "#A78BFA", "Real Estate": "#F472B6", Industrials: "#6EE7B7",
  Utilities: "#67E8F9", Materials: "#FCA5A5", "Communication Services": "#C084FC", "Consumer Discretionary": "#FDA4AF",
  "بنوك": "#FBBF24", "خدمات مالية": "#34D399", "عقارات": "#F472B6", "اتصالات": "#67E8F9",
  "صناعة": "#FB923C", "تكنولوجيا": "#2DD4BF", "أغذية": "#6EE7B7", "أدوية": "#C084FC",
};

// Currency formatting — will be overridden inside component

export default function MustaneerInvestments() {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem("mustaneer_theme"); return s ? s === "dark" : true; } catch { return true; }
  });
  const t = THEMES[darkMode ? "dark" : "light"];
  const { TEAL, TEAL_LIGHT, TEAL_DARK, EMERALD, BG, BG2, CARD, CARD2, BORDER, BORDER_LIGHT, TEXT, TEXT_SEC, TEXT_DIM, RED, GREEN, WHITE, AMBER, PRIMARY, ON_PRIMARY, PRIMARY_CONTAINER, SURFACE_VARIANT, SHADOW } = t;

  useEffect(() => { localStorage.setItem("mustaneer_theme", darkMode ? "dark" : "light"); }, [darkMode]);

  // M3 helpers — useMemo keeps stable references so inputs don't lose focus
  const Pulse = useMemo(() => function Pulse({ color = GREEN, size = 8 }) {
    return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, marginRight: 8, animation: "mPulse 2s infinite" }} />;
  }, [GREEN]);
  const Card = useMemo(() => function Card({ children, style = {}, glow = false }) {
    return <div style={{ background: CARD, borderRadius: 16, padding: "20px 24px", boxShadow: glow ? `0 2px 12px ${SHADOW}, 0 0 0 1px ${PRIMARY}20` : `0 1px 3px ${SHADOW}, 0 1px 2px ${SHADOW}`, border: "none", transition: "box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1)", ...style }}>{children}</div>;
  }, [CARD, SHADOW, PRIMARY]);
  const MetricBox = useMemo(() => function MetricBox({ label, value, change, prefix = "", suffix = "" }) {
    return (
      <div style={{ background: CARD, borderRadius: 16, padding: "18px 20px", flex: "1 1 150px", minWidth: 140, boxShadow: `0 1px 3px ${SHADOW}`, border: "none" }}>
        <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 500, marginBottom: 8, letterSpacing: 0.1 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: TEXT, fontVariantNumeric: "tabular-nums", fontFamily: "'Google Sans', 'Inter', sans-serif" }}>{prefix}{value}{suffix}</div>
        {change !== undefined && (
          <div style={{ fontSize: 12, marginTop: 8, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: change >= 0 ? `${GREEN}18` : `${RED}18`, color: change >= 0 ? GREEN : RED, fontWeight: 500 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{change >= 0 ? "trending_up" : "trending_down"}</span>
            {Math.abs(change).toFixed(2)}%
          </div>
        )}
      </div>
    );
  }, [CARD, SHADOW, TEXT_DIM, TEXT, GREEN, RED]);
  const SectionLabel = useMemo(() => function SectionLabel({ children, right }) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: TEXT_SEC, letterSpacing: 0.1 }}>{children}</div>
        {right && <div>{right}</div>}
      </div>
    );
  }, [TEXT_SEC]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [animateIn, setAnimateIn] = useState(false);
  const [portfolio, setPortfolio] = useState(() => {
    try { const s = localStorage.getItem("mustaneer_portfolio"); return s ? JSON.parse(s) : DEFAULT_PORTFOLIO; } catch { return DEFAULT_PORTFOLIO; }
  });
  const [newRow, setNewRow] = useState({ ticker: "", shares: "", avgCost: "", sector: "Technology" });
  const [editIdx, setEditIdx] = useState(null);
  const [editRow, setEditRow] = useState({ ticker: "", shares: "", avgCost: "", sector: "" });
  const [isMobile, setIsMobile] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [dashboardMarket, setDashboardMarket] = useState("portfolio");
  const [toasts, setToasts] = useState([]);
  const [watchlist, setWatchlist] = useState(() => {
    try { const s = localStorage.getItem("mustaneer_watchlist"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [newWatch, setNewWatch] = useState("");
  const [validating, setValidating] = useState(false);
  const chatEndRef = useRef(null);

  const cx = (n) => n;
  const csym = currency === "EGP" ? "EGP" : "$";
  const fmt = (n) => n != null ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "\u2014";
  const fmtC = (n) => n != null ? (currency === "EGP" ? "EGP " : "$") + Number(cx(n)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "\u2014";
  const fmtP = (n) => n != null ? (currency === "EGP" ? "EGP " : "$") + Number(cx(n)).toFixed(2) : "\u2014";

  const addToast = useCallback((title, message, type = "info") => {
    const id = Date.now();
    setToasts(p => [...p, { id, title, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);

  // Persist portfolio & watchlist
  useEffect(() => { localStorage.setItem("mustaneer_portfolio", JSON.stringify(portfolio)); }, [portfolio]);
  useEffect(() => { localStorage.setItem("mustaneer_watchlist", JSON.stringify(watchlist)); }, [watchlist]);



  // ─── LIVE DATA STATE ───
  const [liveQuotes, setLiveQuotes] = useState({});
  const [liveHistory, setLiveHistory] = useState({});
  const [liveIndices, setLiveIndices] = useState([]);
  const [goldData, setGoldData] = useState(null);
  const [commoditiesData, setCommoditiesData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 80); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ─── FETCH LIVE QUOTES ───
  const fetchQuotes = useCallback(async (tickers) => {
    if (!tickers.length) return;
    try {
      const res = await fetch(`/api/quotes?symbols=${tickers.join(",")}`);
      const data = await res.json();
      const map = {};
      data.forEach(q => { if (q.symbol) map[q.symbol] = q; });
      setLiveQuotes(prev => ({ ...prev, ...map }));
    } catch (err) { console.error("Failed to fetch quotes:", err); }
  }, []);

  // ─── FETCH HISTORY FOR SPARKLINES ───
  const fetchHistory = useCallback(async (tickers) => {
    if (!tickers.length) return;
    try {
      const results = await Promise.allSettled(
        tickers.map(sym => fetch(`/api/history?symbol=${sym}&range=1mo`).then(r => r.json()).then(d => ({ sym, data: d })))
      );
      const hist = {};
      results.forEach(r => { if (r.status === "fulfilled") hist[r.value.sym] = r.value.data; });
      setLiveHistory(prev => ({ ...prev, ...hist }));
    } catch (err) { console.error("Failed to fetch history:", err); }
  }, []);

  // ─── FETCH INDICES ───
  const fetchIndices = useCallback(async () => {
    try {
      const res = await fetch("/api/indices");
      const data = await res.json();
      if (Array.isArray(data)) setLiveIndices(data);
    } catch (err) { console.error("Failed to fetch indices:", err); }
  }, []);

  // ─── FETCH EXCHANGE RATE ───
  // ─── FETCH GOLD DATA ───
  const fetchGold = useCallback(async () => {
    try {
      const res = await fetch("/api/gold-egypt");
      const data = await res.json();
      if (data?.gold) setGoldData(data);
    } catch (err) { console.error("Failed to fetch gold data:", err); }
  }, []);

  // ─── FETCH COMMODITIES ───
  const fetchCommodities = useCallback(async () => {
    try {
      const res = await fetch("/api/commodities");
      const data = await res.json();
      if (data?.commodities) setCommoditiesData(data);
    } catch (err) { console.error("Failed to fetch commodities:", err); }
  }, []);

  // ─── LOAD ALL DATA ───
  const refreshAllData = useCallback(async () => {
    const tickers = [...new Set([...portfolio, ...DEFAULT_PORTFOLIO, ...EGYPTIAN_PORTFOLIO].map(h => h.ticker))];
    if (!tickers.length) return;
    setDataLoading(true);
    await Promise.all([
      fetchQuotes(tickers), fetchHistory(tickers), fetchIndices(),
      fetchGold(), fetchCommodities(),
    ]);
    setLastRefresh(new Date());
    setDataLoading(false);
  }, [portfolio, fetchQuotes, fetchHistory, fetchIndices, fetchGold, fetchCommodities]);

  // ─── Auto-fetch on load & portfolio change ───
  useEffect(() => {
    refreshAllData();
    const interval = setInterval(refreshAllData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [refreshAllData]);

  // ─── COMPUTED DATA ───
  const holdingsData = portfolio.map(h => {
    const q = liveQuotes[h.ticker];
    const price = q?.price ?? h.avgCost;
    const changePercent = q?.changePercent ?? 0;
    const marketValue = h.shares * price;
    const costBasis = h.shares * h.avgCost;
    const pnl = marketValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    const hist = liveHistory[h.ticker] || [];
    return {
      ...h, price, changePercent, marketValue, costBasis, pnl, pnlPercent,
      name: q?.name || h.ticker,
      dayHigh: q?.dayHigh, dayLow: q?.dayLow, volume: q?.volume, marketCap: q?.marketCap,
      fiftyTwoWeekHigh: q?.fiftyTwoWeekHigh, fiftyTwoWeekLow: q?.fiftyTwoWeekLow,
      sparkline: hist.map((p, i) => ({ x: i, y: p.close })),
      isLive: !!q,
    };
  });

  const totalMarketValue = holdingsData.reduce((s, h) => s + h.marketValue, 0) || 1;
  const totalCostBasis = holdingsData.reduce((s, h) => s + h.costBasis, 0) || 1;
  const totalPnL = totalMarketValue - totalCostBasis;
  const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  const sectorTotals = {};
  holdingsData.forEach(h => { sectorTotals[h.sector] = (sectorTotals[h.sector] || 0) + h.marketValue; });
  const sectorData = Object.entries(sectorTotals).map(([name, val]) => ({
    name, value: Math.round((val / totalMarketValue) * 100), color: SECTOR_COLORS[name] || "#5A8A82",
    amount: val,
  }));

  // ─── PERFORMANCE CHART: aggregate portfolio value from holdings' history ───
  const performanceData = (() => {
    const tickers = holdingsData.filter(h => h.sparkline.length > 0);
    if (!tickers.length) return [];
    const maxLen = Math.max(...tickers.map(t => t.sparkline.length));
    return Array.from({ length: maxLen }, (_, i) => {
      let portVal = 0;
      tickers.forEach(t => {
        const idx = Math.min(i, t.sparkline.length - 1);
        portVal += (t.sparkline[idx]?.y || t.avgCost) * t.shares;
      });
      const hist = tickers[0].sparkline[i];
      return {
        day: hist ? new Date(liveHistory[tickers[0].ticker]?.[i]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `D${i + 1}`,
        portfolio: Math.round(portVal),
      };
    });
  })();

  const addHolding = async () => {
    const ticker = newRow.ticker.toUpperCase().trim();
    if (!ticker || !newRow.shares || !newRow.avgCost) { addToast("Missing Fields", "Fill in ticker, shares, and avg cost", "warning"); return; }
    if (+newRow.shares <= 0 || +newRow.avgCost <= 0) { addToast("Invalid Values", "Shares and cost must be positive", "warning"); return; }
    if (portfolio.some(h => h.ticker === ticker)) { addToast("Duplicate Ticker", `${ticker} is already in your portfolio`, "warning"); return; }
    setValidating(true);
    try {
      const res = await fetch(`/api/quotes?symbols=${ticker}`);
      const data = await res.json();
      if (!data?.[0]?.price || data[0].error) { addToast("Invalid Ticker", `"${ticker}" not found on Yahoo Finance`, "error"); setValidating(false); return; }
      setPortfolio(p => [...p, { ticker, shares: +newRow.shares, avgCost: +newRow.avgCost, sector: newRow.sector }]);
      setNewRow({ ticker: "", shares: "", avgCost: "", sector: "Technology" });
      addToast("Position Added", `${ticker} (${data[0].name}) added to portfolio`, "success");
    } catch { addToast("Network Error", "Could not validate ticker", "error"); }
    setValidating(false);
  };
  const removeHolding = (i) => { addToast("Removed", `${portfolio[i].ticker} removed from portfolio`, "info"); setPortfolio(p => p.filter((_, j) => j !== i)); };
  const startEdit = (i) => { setEditIdx(i); setEditRow({ ...portfolio[i], shares: String(portfolio[i].shares), avgCost: String(portfolio[i].avgCost) }); };
  const saveEdit = () => {
    if (!editRow.ticker.trim() || !editRow.shares || !editRow.avgCost) return;
    setPortfolio(p => p.map((h, i) => i === editIdx ? { ticker: editRow.ticker.toUpperCase().trim(), shares: +editRow.shares, avgCost: +editRow.avgCost, sector: editRow.sector } : h));
    setEditIdx(null);
    addToast("Updated", `${editRow.ticker.toUpperCase()} position updated`, "success");
  };

  const exportCSV = () => {
    const rows = [["Ticker", "Name", "Shares", "Avg Cost", "Live Price", "Market Value", "P&L", "P&L %", "Sector", "Weight"]];
    holdingsData.forEach(h => rows.push([h.ticker, h.name, h.shares, h.avgCost.toFixed(2), h.price.toFixed(2), h.marketValue.toFixed(0), h.pnl.toFixed(0), h.pnlPercent.toFixed(2) + "%", h.sector, (h.marketValue / totalMarketValue * 100).toFixed(1) + "%"]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `mustaneer_portfolio_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    addToast("Export Complete", "Portfolio CSV downloaded", "success");
  };

  const sendMessage = useCallback(async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setActiveTab("agent");
    try {
      const portfolioSummary = holdingsData.map(h =>
        `${h.ticker} (${h.name}): ${h.shares} shares @ $${h.avgCost} avg, live price: $${h.price.toFixed(2)}, P&L: $${h.pnl.toFixed(0)} (${h.pnlPercent >= 0 ? "+" : ""}${h.pnlPercent.toFixed(1)}%), sector: ${h.sector}`
      ).join("\n");
      const sectorSummary = sectorData.map(s => `${s.name}: ${s.value}%`).join(", ");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: `You are a senior investment analyst at Mustaneer Investments, specialized in both global and Egyptian markets. You respond ENTIRELY in Egyptian Arabic (عامية مصرية) — casual, warm, and confident like a trusted financial advisor chatting with a friend at a Cairo café. Use Egyptian dialect naturally (مثلا: "كده", "يعني", "بص", "الموضوع ببساطة").

IMPORTANT LANGUAGE RULES:
- ALL responses must be in Egyptian Arabic (عامية مصرية), never formal Arabic (فصحى) and never English
- Use Arabic numerals and currency formatting (e.g., $142.50 or EGP 7,125 is fine, but text must be Arabic)
- Financial terms can stay in English when there's no common Arabic equivalent (e.g., Sharpe ratio, P/E, VaR)
- Ticker symbols stay in English (AAPL, MSFT, COMI.CA, etc.)
- Tickers ending in .CA are Egyptian stocks listed on the Egyptian Exchange (EGX) in Cairo
- Use **bold** for section headers (write headers in Arabic)

CLIENT PORTFOLIO (LIVE DATA):
${portfolioSummary}
Total Market Value: $${totalMarketValue.toLocaleString()}
Total Cost Basis: $${totalCostBasis.toLocaleString()}
Total P&L: $${totalPnL.toLocaleString()} (${totalPnLPercent >= 0 ? "+" : ""}${totalPnLPercent.toFixed(2)}%)
Sector Allocation: ${sectorSummary}

EGYPTIAN MARKET DATA:
${goldData ? `- Gold 24K: EGP ${goldData.gold.karats["24K"].perGram}/gram (${goldData.gold.change >= 0 ? "+" : ""}${goldData.gold.change.toFixed(2)}%)
- Gold 21K: EGP ${goldData.gold.karats["21K"].perGram}/gram (most traded karat in Egypt)
- Gold 18K: EGP ${goldData.gold.karats["18K"].perGram}/gram
- Silver: EGP ${goldData.silver.egpPerGram}/gram` : "Gold data unavailable"}
${commoditiesData ? commoditiesData.commodities.map(c => `- ${c.name}: $${c.priceUsd.toFixed(2)} / EGP ${c.priceEgp.toFixed(0)} per ${c.unit} (${c.change >= 0 ? "+" : ""}${c.change.toFixed(2)}%)`).join("\n") : ""}
${liveIndices.find(i => i.sym === "EGX30") ? `- EGX 30 Index: ${liveIndices.find(i => i.sym === "EGX30").val.toLocaleString()} (${liveIndices.find(i => i.sym === "EGX30").change >= 0 ? "+" : ""}${liveIndices.find(i => i.sym === "EGX30").change.toFixed(2)}%)` : ""}

RESPONSE RULES:
- Prices shown above are LIVE from Yahoo Finance and market APIs — use them as current data
- Search the web for breaking news and earnings when relevant
- Be quantitative: numbers, percentages, ratios always
- Give actionable recommendations with specific price targets
- Reference portfolio theory (Sharpe, beta, correlation, VaR)
- When discussing Egyptian stocks (ending in .CA), provide context about EGX market conditions
- When asked about gold or commodities, use the live Egyptian prices above
- For Egyptian portfolios, use EGP values; for US portfolios, use USD
- Under 350 words, focused and professional but friendly Egyptian tone
- End with a clear **التوصية** section
- Never use emojis`,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: userMsg }
          ],
        }),
      });
      const data = await response.json();
      const textContent = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "Analysis complete.";
      setMessages(prev => [...prev, { role: "assistant", content: textContent }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection interrupted. Please retry your query." }]);
      addToast("AI Error", "Failed to get response from Claude", "error");
    }
    setLoading(false);
  }, [input, messages, holdingsData, sectorData, totalMarketValue, totalCostBasis, totalPnL, totalPnLPercent, goldData, commoditiesData, liveIndices, currency]);

  const formatMd = (text) => text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**"))
      return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: TEAL_LIGHT, marginTop: 14, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.6 }}>{line.replace(/\*\*/g, "")}</div>;
    if (line.includes("**")) {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return <div key={i} style={{ marginBottom: 3, lineHeight: 1.65 }}>{parts.map((p, j) =>
        p.startsWith("**") ? <strong key={j} style={{ color: TEXT }}>{p.replace(/\*\*/g, "")}</strong> : <span key={j}>{p}</span>
      )}</div>;
    }
    if (line.startsWith("- ") || line.startsWith("• "))
      return <div key={i} style={{ paddingLeft: 14, marginBottom: 2, lineHeight: 1.6 }}><span style={{ color: TEAL, marginRight: 6 }}>{"\u203A"}</span>{line.slice(2)}</div>;
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    return <div key={i} style={{ marginBottom: 3, lineHeight: 1.7 }}>{line}</div>;
  });

  const inp = (extra = {}) => ({
    background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 12,
    padding: "12px 16px", color: TEXT, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.2s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.2s", fontFamily: "inherit", fontWeight: 400, ...extra
  });
  const btn = (bg, clr, extra = {}) => ({
    background: bg, border: "none", borderRadius: 20, padding: "10px 20px",
    color: clr, fontWeight: 500, fontSize: 13, cursor: "pointer", transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)", whiteSpace: "nowrap", fontFamily: "inherit", letterSpacing: 0.1, ...extra
  });

  const SUGGESTIONS = [
    "Analyze portfolio risk exposure and concentration",
    "Recommend rebalancing moves with specific share counts",
    "Compare my tech weighting to S&P 500 benchmarks",
    "Impact of rising interest rates on my holdings",
    "Generate an executive portfolio summary for CFO review",
    "Search latest earnings and news for my holdings",
  ];

  // ─── PORTFOLIO TAB ───
  const renderPortfolio = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Live data status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "8px 14px" : "10px 18px", background: BG2, borderRadius: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: dataLoading ? TEAL : GREEN, fontWeight: 500 }}>
          <Pulse color={dataLoading ? TEAL : GREEN} />
          {dataLoading ? "Fetching live data..." : `Live · ${Object.keys(liveQuotes).length} tickers`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastRefresh && !isMobile && <span style={{ fontSize: 12, color: TEXT_DIM }}>Updated {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={refreshAllData} disabled={dataLoading} style={btn(PRIMARY_CONTAINER, darkMode ? TEAL_LIGHT : TEAL, { padding: "6px 16px", fontSize: 12, opacity: dataLoading ? 0.4 : 1 })}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, marginRight: 4, verticalAlign: "middle" }}>refresh</span>Refresh
          </button>
        </div>
      </div>

      <Card glow>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 20, flexWrap: "wrap", gap: 12, flexDirection: isMobile ? "column" : "row" }}>
          <div>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 500, color: TEXT }}>Portfolio Holdings</div>
            <div style={{ fontSize: isMobile ? 12 : 13, color: TEXT_DIM, marginTop: 4 }}>
              {portfolio.length} positions {"·"} {fmtC(totalMarketValue)} {"·"} <span style={{ color: totalPnL >= 0 ? GREEN : RED }}>{totalPnL >= 0 ? "+" : ""}{fmtC(totalPnL)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={exportCSV} style={btn(BG2, TEXT_SEC, { padding: isMobile ? "7px 12px" : "8px 16px", fontSize: isMobile ? 11 : 12 })}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, marginRight: 4, verticalAlign: "middle" }}>download</span>Export
            </button>
            <button onClick={() => setPortfolio(DEFAULT_PORTFOLIO)} style={btn(portfolio === DEFAULT_PORTFOLIO ? PRIMARY_CONTAINER : BG2, portfolio === DEFAULT_PORTFOLIO ? (darkMode ? TEAL_LIGHT : TEAL) : TEXT_SEC, { padding: isMobile ? "7px 12px" : "8px 16px", fontSize: isMobile ? 11 : 12 })}>US Sample</button>
            <button onClick={() => setPortfolio(EGYPTIAN_PORTFOLIO)} style={btn(portfolio === EGYPTIAN_PORTFOLIO ? PRIMARY_CONTAINER : BG2, portfolio === EGYPTIAN_PORTFOLIO ? (darkMode ? TEAL_LIGHT : TEAL) : TEXT_SEC, { padding: isMobile ? "7px 12px" : "8px 16px", fontSize: isMobile ? 11 : 12 })}>EGX Sample</button>
            <button onClick={() => setPortfolio([])} style={btn(`${RED}15`, RED, { padding: isMobile ? "7px 12px" : "8px 16px", fontSize: isMobile ? 11 : 12 })}>Clear</button>
            {!isMobile && <button onClick={() => setActiveTab("dashboard")} style={btn(TEAL, darkMode ? "#111318" : "#FFFFFF", { padding: "8px 20px" })}>View Dashboard →</button>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", padding: 16, background: BG2, borderRadius: 12, marginBottom: 16 }}>
          <div style={{ flex: "1 1 120px", minWidth: 90 }}>
            <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 500, marginBottom: 6 }}>Ticker</div>
            <input value={newRow.ticker} onChange={e => setNewRow(p => ({ ...p, ticker: e.target.value }))} placeholder="AAPL" style={inp()} onKeyDown={e => e.key === "Enter" && addHolding()} />
          </div>
          <div style={{ flex: "1 1 90px", minWidth: 70 }}>
            <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 500, marginBottom: 6 }}>Shares</div>
            <input value={newRow.shares} onChange={e => setNewRow(p => ({ ...p, shares: e.target.value }))} placeholder="100" type="number" style={inp()} onKeyDown={e => e.key === "Enter" && addHolding()} />
          </div>
          <div style={{ flex: "1 1 90px", minWidth: 70 }}>
            <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 500, marginBottom: 6 }}>Avg Cost</div>
            <input value={newRow.avgCost} onChange={e => setNewRow(p => ({ ...p, avgCost: e.target.value }))} placeholder="150.00" type="number" step="0.01" style={inp()} onKeyDown={e => e.key === "Enter" && addHolding()} />
          </div>
          <div style={{ flex: "1 1 130px", minWidth: 110 }}>
            <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 500, marginBottom: 6 }}>Sector</div>
            <select value={newRow.sector} onChange={e => setNewRow(p => ({ ...p, sector: e.target.value }))} style={inp({ cursor: "pointer" })}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={addHolding} disabled={validating} style={btn(TEAL, darkMode ? "#111318" : "#FFFFFF", { padding: "12px 24px", opacity: validating ? 0.5 : 1 })}>{validating ? "Checking..." : "Add Position"}</button>
        </div>

        {portfolio.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: TEXT_DIM }}>
            <span className="material-symbols-rounded" style={{ fontSize: 48, color: TEAL, marginBottom: 12, display: "block", opacity: 0.6 }}>add_chart</span>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, color: TEXT }}>No holdings yet</div>
            <div style={{ fontSize: 13 }}>Add positions above or load sample data</div>
          </div>
        ) : isMobile ? (
          /* ─── MOBILE CARD LAYOUT ─── */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {holdingsData.map((h, i) => (
              <div key={i} style={{ background: BG2, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: TEXT, fontSize: 15 }}>{h.ticker}</span>
                    <span style={{ fontSize: 10, color: TEXT_DIM, marginLeft: 6 }}>{h.shares} shares</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => startEdit(i)} style={btn(`${TEAL}18`, TEAL_LIGHT, { padding: "3px 8px", fontSize: 10 })}>Edit</button>
                    <button onClick={() => removeHolding(i)} style={btn(`${RED}15`, RED, { padding: "3px 8px", fontSize: 10 })}>{"\u00D7"}</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12 }}>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Price </span><span style={{ color: TEXT, fontWeight: 500 }}>{fmtP(h.price)}</span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Change </span><span style={{ color: h.changePercent >= 0 ? GREEN : RED }}>{h.changePercent >= 0 ? "+" : ""}{h.changePercent.toFixed(2)}%</span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Value </span><span style={{ color: TEXT }}>{fmtC(h.marketValue)}</span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>P&L </span><span style={{ color: h.pnl >= 0 ? GREEN : RED, fontWeight: 600 }}>{h.pnl >= 0 ? "+" : ""}{fmtC(h.pnl)} <span style={{ fontSize: 10, opacity: 0.8 }}>({h.pnlPercent.toFixed(1)}%)</span></span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Cost </span><span style={{ color: TEXT_SEC }}>{fmtP(h.avgCost)}</span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Weight </span><span style={{ color: TEXT_SEC }}>{(h.marketValue / totalMarketValue * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto", margin: "0 -18px", padding: "0 18px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 820 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Ticker", "Live Price", "Change", "Shares", "Avg Cost", "Market Value", "P&L", "Weight", "Trend", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 8px", color: TEXT_DIM, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdingsData.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}15` }}>
                    {editIdx === i ? (<>
                      <td style={{ padding: "5px 8px" }}><input value={editRow.ticker} onChange={e => setEditRow(p => ({ ...p, ticker: e.target.value }))} style={inp({ padding: "5px 8px" })} /></td>
                      <td colSpan={2} style={{ padding: "5px 8px", color: TEXT_DIM, fontSize: 11 }}>{h.isLive ? fmtP(h.price) : "—"}</td>
                      <td style={{ padding: "5px 8px" }}><input value={editRow.shares} onChange={e => setEditRow(p => ({ ...p, shares: e.target.value }))} type="number" style={inp({ padding: "5px 8px" })} /></td>
                      <td style={{ padding: "5px 8px" }}><input value={editRow.avgCost} onChange={e => setEditRow(p => ({ ...p, avgCost: e.target.value }))} type="number" step="0.01" style={inp({ padding: "5px 8px" })} /></td>
                      <td style={{ padding: "5px 8px", color: TEXT_DIM }}>{fmtC(+editRow.shares * h.price)}</td>
                      <td style={{ padding: "5px 8px", color: TEXT_DIM }}>{"\u2014"}</td>
                      <td style={{ padding: "5px 8px", color: TEXT_DIM }}>{"\u2014"}</td>
                      <td style={{ padding: "5px 8px" }}></td>
                      <td style={{ padding: "5px 8px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={saveEdit} style={btn(GREEN, BG, { padding: "4px 10px", fontSize: 11 })}>Save</button>
                          <button onClick={() => setEditIdx(null)} style={btn(`${RED}30`, RED, { padding: "4px 10px", fontSize: 11 })}>Cancel</button>
                        </div>
                      </td>
                    </>) : (<>
                      <td style={{ padding: "8px 8px" }}>
                        <div style={{ fontWeight: 600, color: TEXT }}>{h.ticker}</div>
                        <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 1 }}>{h.name !== h.ticker ? h.name : ""}</div>
                      </td>
                      <td style={{ padding: "8px 8px", color: TEXT, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {fmtP(h.price)}
                        {!h.isLive && <span style={{ fontSize: 9, color: TEXT_DIM, marginLeft: 4 }}>avg</span>}
                      </td>
                      <td style={{ padding: "8px 8px", color: h.changePercent >= 0 ? GREEN : RED, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                        {h.isLive ? `${h.changePercent >= 0 ? "+" : ""}${h.changePercent.toFixed(2)}%` : "—"}
                      </td>
                      <td style={{ padding: "8px 8px", color: TEXT_SEC, fontVariantNumeric: "tabular-nums" }}>{h.shares.toLocaleString()}</td>
                      <td style={{ padding: "8px 8px", color: TEXT_DIM, fontVariantNumeric: "tabular-nums" }}>{fmtP(h.avgCost)}</td>
                      <td style={{ padding: "8px 8px", color: TEXT, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtC(h.marketValue)}</td>
                      <td style={{ padding: "8px 8px", fontVariantNumeric: "tabular-nums" }}>
                        <div style={{ color: h.pnl >= 0 ? GREEN : RED, fontWeight: 600 }}>{h.pnl >= 0 ? "+" : ""}{fmtC(h.pnl)}</div>
                        <div style={{ fontSize: 10, color: h.pnlPercent >= 0 ? GREEN : RED, opacity: 0.8 }}>{h.pnlPercent >= 0 ? "+" : ""}{h.pnlPercent.toFixed(1)}%</div>
                      </td>
                      <td style={{ padding: "8px 8px", color: TEXT_DIM, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{(h.marketValue / totalMarketValue * 100).toFixed(1)}%</td>
                      <td style={{ padding: "8px 8px", width: 72 }}>
                        {h.sparkline.length > 1 ? (
                          <svg width="68" height="22" viewBox="0 0 68 22">
                            <polyline fill="none" stroke={h.pnl >= 0 ? GREEN : RED} strokeWidth="1.3"
                              points={h.sparkline.map((p, j) => {
                                const ys = h.sparkline.map(s => s.y);
                                const mn = Math.min(...ys), mx = Math.max(...ys);
                                return `${(j / (h.sparkline.length - 1)) * 66 + 1},${20 - ((p.y - mn) / (mx - mn || 1)) * 18 - 1}`;
                              }).join(" ")} />
                          </svg>
                        ) : <span style={{ color: TEXT_DIM, fontSize: 10 }}>—</span>}
                      </td>
                      <td style={{ padding: "8px 8px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => startEdit(i)} style={btn(`${TEAL}18`, TEAL_LIGHT, { padding: "4px 10px", fontSize: 11 })}>Edit</button>
                          <button onClick={() => removeHolding(i)} style={btn(`${RED}15`, RED, { padding: "4px 10px", fontSize: 11 })}>{"\u00D7"}</button>
                        </div>
                      </td>
                    </>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {portfolio.length > 0 && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Card style={{ flex: "1 1 240px" }}>
            <SectionLabel>Sector Breakdown (by Market Value)</SectionLabel>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                  {sectorData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: TEXT }} formatter={(v, _, p) => [`${v}% · ${fmtC(p.payload.amount)}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {sectorData.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: TEXT_DIM }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: s.color, display: "inline-block" }} />{s.name} {s.value}%
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flex: "1 1 280px" }} glow>
            <SectionLabel>Quick Analysis</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Full Risk Analysis", icon: "shield", q: "Analyze my current portfolio risk and give me a full risk report" },
                { label: "Rebalancing Recommendations", icon: "balance", q: "What rebalancing moves should I make right now? Be specific with share counts." },
                { label: "Executive Summary", icon: "summarize", q: "Generate a CFO-level executive portfolio summary with key metrics and outlook." },
                { label: "News Impact Analysis", icon: "newspaper", q: "Search for the latest market news affecting my portfolio holdings and assess impact." },
              ].map((item, i) => (
                <button key={i} onClick={() => sendMessage(item.q)} style={{
                  background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 16px",
                  color: TEXT_SEC, fontSize: 13, cursor: "pointer", textAlign: "left", transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
                  display: "flex", alignItems: "center", gap: 12, fontFamily: "inherit", fontWeight: 500
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.background = `${TEAL}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "transparent"; }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: TEAL, opacity: 0.7 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
  // Dashboard-specific data based on market toggle
  const dashboardSource = dashboardMarket === "US" ? DEFAULT_PORTFOLIO : dashboardMarket === "EG" ? EGYPTIAN_PORTFOLIO : portfolio;
  const dbHoldings = dashboardSource.map(h => {
    const q = liveQuotes[h.ticker];
    const price = q?.price ?? h.avgCost;
    const changePercent = q?.changePercent ?? 0;
    const marketValue = h.shares * price;
    const costBasis = h.shares * h.avgCost;
    const pnl = marketValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    const hist = liveHistory[h.ticker] || [];
    return {
      ...h, price, changePercent, marketValue, costBasis, pnl, pnlPercent,
      name: q?.name || h.ticker,
      dayHigh: q?.dayHigh, dayLow: q?.dayLow, volume: q?.volume, marketCap: q?.marketCap,
      fiftyTwoWeekHigh: q?.fiftyTwoWeekHigh, fiftyTwoWeekLow: q?.fiftyTwoWeekLow,
      sparkline: hist.map((p, j) => ({ x: j, y: p.close })),
      isLive: !!q,
    };
  });
  const dbTotalMV = dbHoldings.reduce((s, h) => s + h.marketValue, 0) || 1;
  const dbTotalCB = dbHoldings.reduce((s, h) => s + h.costBasis, 0) || 1;
  const dbTotalPnL = dbTotalMV - dbTotalCB;
  const dbTotalPnLPct = dbTotalCB > 0 ? (dbTotalPnL / dbTotalCB) * 100 : 0;
  const dbSectorTotals = {};
  dbHoldings.forEach(h => { dbSectorTotals[h.sector] = (dbSectorTotals[h.sector] || 0) + h.marketValue; });
  const dbSectorData = Object.entries(dbSectorTotals).map(([name, val]) => ({
    name, value: Math.round((val / dbTotalMV) * 100), color: SECTOR_COLORS[name] || "#5A8A82", amount: val,
  }));
  const dbPerfData = (() => {
    const tickers = dbHoldings.filter(h => h.sparkline.length > 0);
    if (!tickers.length) return [];
    const maxLen = Math.max(...tickers.map(t => t.sparkline.length));
    return Array.from({ length: maxLen }, (_, i) => {
      let portVal = 0;
      tickers.forEach(t => {
        const idx = Math.min(i, t.sparkline.length - 1);
        portVal += (t.sparkline[idx]?.y || t.avgCost) * t.shares;
      });
      const hist = tickers[0].sparkline[i];
      return {
        day: hist ? new Date(liveHistory[tickers[0].ticker]?.[i]?.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `D${i + 1}`,
        portfolio: portVal,
      };
    });
  })();

  // ─── DASHBOARD TAB ───
  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Market Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 0, background: BG2, borderRadius: 20, padding: 4 }}>
          {[{ id: "portfolio", label: "My Portfolio" }, { id: "US", label: "US Market" }, { id: "EG", label: "EG Market" }].map(m => (
            <button key={m.id} onClick={() => setDashboardMarket(m.id)} style={{
              padding: "8px 18px", borderRadius: 16, border: "none",
              fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
              background: dashboardMarket === m.id ? TEAL : "transparent",
              color: dashboardMarket === m.id ? (darkMode ? "#111318" : "#FFFFFF") : TEXT_DIM,
              fontFamily: "inherit", letterSpacing: 0.1,
            }}>{m.label}</button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 500 }}>
          {dashboardMarket === "portfolio" ? `${portfolio.length} positions` : dashboardMarket === "US" ? "8 US stocks" : "8 EGX stocks"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricBox label={`Market Value (${currency})`} value={fmt(cx(dbTotalMV))} prefix={csym} change={dbTotalPnLPct} />
        <MetricBox label={`Total P&L (${currency})`} value={`${dbTotalPnL >= 0 ? "+" : ""}${fmt(cx(dbTotalPnL))}`} prefix={csym} change={dbTotalPnLPct} />
        <MetricBox label={`Cost Basis (${currency})`} value={fmt(cx(dbTotalCB))} prefix={csym} />
        <MetricBox label="Positions" value={dbHoldings.length} />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: "2 1 320px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <SectionLabel>Portfolio Value (30D Live)</SectionLabel>
          </div>
          {dbPerfData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dbPerfData}>
                <defs>
                  <linearGradient id="gPort" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL_LIGHT} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={TEAL_LIGHT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: TEXT_DIM }} axisLine={{ stroke: BORDER }} interval="preserveStartEnd" />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: TEXT }} formatter={v => [`${csym}${(cx(+v)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, "Portfolio"]} />
                <Area type="monotone" dataKey="portfolio" stroke={TEAL_LIGHT} fill="url(#gPort)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_DIM, fontSize: 12 }}>
              {dataLoading ? "Loading historical data..." : "No historical data available"}
            </div>
          )}
        </Card>

        <Card style={{ flex: "1 1 220px" }}>
          <SectionLabel>Allocation</SectionLabel>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={dbSectorData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {dbSectorData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: TEXT }} formatter={(v, _, p) => [`${v}% · ${fmtC(p.payload.amount)}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {dbSectorData.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: TEXT_DIM }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: s.color, display: "inline-block" }} />{s.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Gold & Commodities Row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Card style={{ flex: "1 1 280px" }} glow>
          <SectionLabel>أسعار الذهب (EGP/جرام)</SectionLabel>
          {goldData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(goldData.gold.karats).map(([karat, info]) => (
                <div key={karat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: `${AMBER}06`, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: AMBER }}>{info.label}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>{karat}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>EGP {info.perGram.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: goldData.gold.change >= 0 ? GREEN : RED }}>
                      {goldData.gold.change >= 0 ? "▲" : "▼"} {Math.abs(goldData.gold.change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
              {goldData.silver && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: BG2, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_SEC }}>{goldData.silver.label}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>فضة / جرام</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontVariantNumeric: "tabular-nums" }}>EGP {goldData.silver.egpPerGram.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: goldData.silver.change >= 0 ? GREEN : RED }}>
                      {goldData.silver.change >= 0 ? "▲" : "▼"} {Math.abs(goldData.silver.change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: TEXT_DIM, fontSize: 12 }}>{dataLoading ? "جاري التحميل..." : "—"}</div>
          )}
        </Card>

        <Card style={{ flex: "1 1 240px" }}>
          <SectionLabel>أسعار السلع</SectionLabel>
          {commoditiesData ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {commoditiesData.commodities.map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: BG2, borderRadius: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: TEXT_DIM }}>{c.unit}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, fontVariantNumeric: "tabular-nums" }}>
                      {currency === "EGP" ? `EGP ${c.priceEgp.toLocaleString()}` : `$${c.priceUsd.toFixed(2)}`}
                    </div>
                    <div style={{ fontSize: 10, color: c.change >= 0 ? GREEN : RED }}>
                      {c.change >= 0 ? "▲" : "▼"} {Math.abs(c.change).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: TEXT_DIM, fontSize: 12 }}>{dataLoading ? "جاري التحميل..." : "—"}</div>
          )}
        </Card>
      </div>
      <Card>
        <SectionLabel>Holdings Overview</SectionLabel>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dbHoldings.map((h, i) => (
              <div key={i} style={{ background: `${BG2}80`, borderRadius: 8, padding: "10px 12px", border: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: TEXT, fontSize: 14 }}>{h.ticker}</span>
                    <span style={{ fontSize: 10, color: TEXT_DIM, marginLeft: 6 }}>{h.shares} shares</span>
                  </div>
                  <span style={{ color: h.changePercent >= 0 ? GREEN : RED, fontSize: 12, fontWeight: 600 }}>{h.changePercent >= 0 ? "+" : ""}{h.changePercent.toFixed(2)}%</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 12 }}>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Price </span><span style={{ color: TEXT }}>{fmtP(h.price)}</span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Value </span><span style={{ color: TEXT }}>{fmtC(h.marketValue)}</span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>P&L </span><span style={{ color: h.pnl >= 0 ? GREEN : RED }}>{h.pnl >= 0 ? "+" : ""}{fmtC(h.pnl)} ({h.pnlPercent.toFixed(1)}%)</span></div>
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Weight </span><span style={{ color: TEXT_SEC }}>{(h.marketValue / dbTotalMV * 100).toFixed(1)}%</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto", margin: "0 -18px", padding: "0 18px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {["Ticker", "Price", "Day Change", "Market Value", "P&L", "Weight", "30D Trend"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "7px 8px", color: TEXT_DIM, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dbHoldings.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${BORDER}12` }}>
                    <td style={{ padding: "8px 8px" }}>
                      <div style={{ fontWeight: 600, color: TEXT }}>{h.ticker}</div>
                      <div style={{ fontSize: 10, color: TEXT_DIM }}>{h.shares} shares</div>
                    </td>
                    <td style={{ padding: "8px 8px", color: TEXT, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtP(h.price)}</td>
                    <td style={{ padding: "8px 8px", color: h.changePercent >= 0 ? GREEN : RED, fontVariantNumeric: "tabular-nums" }}>{h.changePercent >= 0 ? "+" : ""}{h.changePercent.toFixed(2)}%</td>
                    <td style={{ padding: "8px 8px", color: TEXT, fontVariantNumeric: "tabular-nums" }}>{fmtC(h.marketValue)}</td>
                    <td style={{ padding: "8px 8px", fontVariantNumeric: "tabular-nums" }}>
                      <span style={{ color: h.pnl >= 0 ? GREEN : RED }}>{h.pnl >= 0 ? "+" : ""}{fmtC(h.pnl)}</span>
                      <span style={{ fontSize: 10, color: h.pnlPercent >= 0 ? GREEN : RED, marginLeft: 4 }}>({h.pnlPercent.toFixed(1)}%)</span>
                    </td>
                    <td style={{ padding: "8px 8px", color: TEXT_DIM, fontVariantNumeric: "tabular-nums" }}>{(h.marketValue / dbTotalMV * 100).toFixed(1)}%</td>
                    <td style={{ padding: "8px 8px", width: 72 }}>
                      {h.sparkline.length > 1 ? (
                        <svg width="68" height="20" viewBox="0 0 68 20">
                          <polyline fill="none" stroke={h.pnl >= 0 ? GREEN : RED} strokeWidth="1.3"
                            points={h.sparkline.map((p, j) => {
                              const ys = h.sparkline.map(s => s.y);
                              const mn = Math.min(...ys), mx = Math.max(...ys);
                              return `${(j / (h.sparkline.length - 1)) * 66 + 1},${18 - ((p.y - mn) / (mx - mn || 1)) * 16 - 1}`;
                            }).join(" ")} />
                        </svg>
                      ) : <span style={{ color: TEXT_DIM, fontSize: 10 }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  // ─── AGENT TAB ───
  const renderAgent = () => (
    <div style={{ display: "flex", gap: 16, height: "calc(100dvh - 120px)", overflow: "hidden" }}>
      {/* Main Chat Interface */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 300 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: isMobile ? "30px 12px" : "50px 16px" }}>
              <img src={CLAUDE_LOGO} alt="Claude" style={{ width: 56, height: 56, borderRadius: 16, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ fontSize: 22, fontWeight: 500, color: TEXT, marginTop: 12, marginBottom: 6 }}>Investment Analyst</div>
              <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>Powered by Claude <img src={CLAUDE_LOGO} alt="Claude" style={{ height: 16, objectFit: "contain" }} /></div>
              <div style={{ fontSize: 14, color: TEXT_DIM, marginBottom: 32, maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.6 }}>
                AI-powered portfolio analysis with <strong style={{ color: GREEN }}>live market data</strong> and real-time intelligence
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520, margin: "0 auto" }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)} style={{
                    background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "8px 16px",
                    color: TEXT_SEC, fontSize: 12, cursor: "pointer", transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)", fontFamily: "inherit", fontWeight: 500
                  }}
                    onMouseEnter={e => { e.target.style.borderColor = TEAL; e.target.style.color = TEAL; e.target.style.background = `${TEAL}08`; }}
                    onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = TEXT_SEC; e.target.style.background = "transparent"; }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12, padding: "0 4px" }}>
              <div style={{
                maxWidth: isMobile ? "94%" : "80%", padding: "14px 18px", borderRadius: 20,
                background: m.role === "user" ? TEAL : BG2,
                border: "none", boxShadow: m.role === "user" ? "none" : `0 1px 3px ${SHADOW}`,
                color: m.role === "user" ? (darkMode ? "#111318" : "#FFFFFF") : TEXT, fontSize: 14, lineHeight: 1.7,
                borderBottomRightRadius: m.role === "user" ? 6 : 20,
                borderBottomLeftRadius: m.role === "user" ? 20 : 6,
              }}>
                {m.role === "assistant" ? (
                  <div>
                    <div style={{ fontSize: 11, color: TEAL, marginBottom: 8, fontWeight: 500, display: "flex", alignItems: "center", direction: "ltr" }}>
                      <Pulse /> Powered by Claude <img src={CLAUDE_LOGO} alt="" style={{ height: 13, objectFit: "contain", marginLeft: 4 }} />
                    </div>
                    <div style={{ direction: "rtl", textAlign: "right", unicodeBidi: "plaintext" }}>
                      {formatMd(m.content)}
                    </div>
                  </div>
                ) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", padding: "0 4px", marginBottom: 12 }}>
              <div style={{ background: BG2, borderRadius: 20, borderBottomLeftRadius: 6, padding: "14px 18px", boxShadow: `0 1px 3px ${SHADOW}` }}>
                <div style={{ fontSize: 11, color: TEAL, marginBottom: 6, fontWeight: 500, display: "flex", alignItems: "center" }}>
                  <Pulse /> Powered by Claude
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 13, color: TEXT_DIM }}>
                  Analyzing market data
                  {[0, 1, 2].map(j => <span key={j} style={{ animation: `mBlink 1.4s ${j * 0.2}s infinite`, opacity: 0 }}>.</span>)}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: "12px 0 0", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", background: BG2, borderRadius: 28, padding: "6px 8px 6px 20px", boxShadow: `0 2px 8px ${SHADOW}` }}>
            {messages.length > 0 && (
              <button onClick={() => setMessages([])} style={{ background: "transparent", border: "none", borderRadius: 20, width: 36, height: 36, color: RED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title="New Chat">
                <span className="material-symbols-rounded" style={{ fontSize: 20 }}>delete</span>
              </button>
            )}
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && sendMessage()}
              placeholder={isMobile ? "Ask anything..." : "Ask about your portfolio, market conditions, risk..."}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: 15, fontFamily: "inherit", padding: "10px 0" }}
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
              style={{ background: TEAL, border: "none", borderRadius: 20, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: loading || !input.trim() ? 0.3 : 1, transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)", flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: darkMode ? "#111318" : "#FFFFFF" }}>send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Automated Reports & Alerts (Fake Feature) */}
      {!isMobile && (
        <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 4, flexShrink: 0 }}>
          <Card style={{ padding: "18px 20px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-rounded" style={{ color: AMBER, fontSize: 20 }}>notifications_active</span>
              Automated Priority Alerts
            </h3>
            <p style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 16, lineHeight: 1.5, marginTop: 0 }}>
              Instant notifications when market volatility, news, or macroeconomic shifts impact your holdings.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: `${RED}08`, borderLeft: `3px solid ${RED}`, padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
                <div style={{ fontSize: 11, color: RED, fontWeight: 600, marginBottom: 4 }}>URGENT: TMGH.CA</div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.4 }}>Sudden 5% pre-market drop based on real estate sector news. <a href="#" style={{ color: TEAL, textDecoration: "none" }}>View analysis</a></div>
              </div>
              <div style={{ background: `${AMBER}08`, borderLeft: `3px solid ${AMBER}`, padding: "10px 12px", borderRadius: "0 8px 8px 0" }}>
                <div style={{ fontSize: 11, color: AMBER, fontWeight: 600, marginBottom: 4 }}>RATES: US10Y</div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.4 }}>Yields holding above 4.1%. Expect pressure on your tech allocation.</div>
              </div>
            </div>
            <button style={{ ...btn(BG2, TEXT_SEC, { width: "100%", marginTop: 16, fontSize: 13, padding: "10px", borderRadius: 12 }), border: `1px solid ${BORDER}` }}>Configure Triggers</button>
          </Card>

          <Card style={{ padding: "18px 20px", flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-rounded" style={{ color: TEAL, fontSize: 20 }}>docs_add_on</span>
              Executive Reporting
            </h3>
            <p style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 16, lineHeight: 1.5, marginTop: 0 }}>
              Schedule automated CFO-level P&L and risk exposure reports delivered to your inbox or WhatsApp.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, marginBottom: 6, display: "block" }}>Email Delivery</label>
                <input placeholder="executive@mustaneer.com" style={{ width: "100%", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 12px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, marginBottom: 6, display: "block" }}>WhatsApp Alerts (Optional)</label>
                <input placeholder="+20 123 456 7890" style={{ width: "100%", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 12px", color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <button style={btn(PRIMARY_CONTAINER, darkMode ? TEAL_LIGHT : TEAL, { width: "100%", marginTop: 8, fontSize: 13, padding: "11px", borderRadius: 12 })}>Save Preferences</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: "portfolio", label: "Portfolio" },
    { id: "dashboard", label: "Dashboard" },
    { id: "agent", label: "AI Analyst" },
  ];

  // ─── LIVE TICKER BAR DATA ───
  const tickerData = liveIndices.length > 0
    ? liveIndices.map(idx => ({
      sym: idx.sym,
      val: idx.sym === "US10Y" ? `${idx.val.toFixed(2)}%` : idx.val.toLocaleString(undefined, { maximumFractionDigits: idx.val > 100 ? 0 : 2 }),
      ch: `${idx.change >= 0 ? "+" : ""}${idx.change.toFixed(2)}%`,
    }))
    : [
      { sym: "EGX30", val: "—", ch: "—" },
      { sym: "SPX", val: "—", ch: "—" },
      { sym: "NDX", val: "—", ch: "—" },
      { sym: "DJI", val: "—", ch: "—" },
      { sym: "VIX", val: "—", ch: "—" },
    ];

  return (
    <div style={{ background: BG, minHeight: "100vh", height: activeTab === "agent" ? "100dvh" : undefined, overflow: activeTab === "agent" ? "hidden" : undefined, color: TEXT, fontFamily: "'Google Sans', 'Google Sans Text', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif", opacity: animateIn ? 1 : 0, transition: "opacity 0.4s cubic-bezier(0.2, 0, 0, 1)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes mPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes mFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mBlink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}80; border-radius: 20px; border: 2px solid transparent; background-clip: padding-box; }
        ::-webkit-scrollbar-thumb:hover { background: ${BORDER}; border-radius: 20px; border: 2px solid transparent; background-clip: padding-box; }
        select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23747775' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px !important; }
        select option { background: ${CARD}; color: ${TEXT}; }
        body { margin: 0; padding: 0; }
        input:focus, select:focus { border-color: ${TEAL} !important; box-shadow: 0 0 0 1px ${TEAL} !important; }
        .material-symbols-rounded { font-family: 'Material Symbols Rounded'; font-weight: normal; font-style: normal; font-size: 24px; display: inline-block; line-height: 1; text-transform: none; letter-spacing: normal; word-wrap: normal; white-space: nowrap; direction: ltr; -webkit-font-smoothing: antialiased; font-feature-settings: 'liga'; }
      `}</style>

      {/* Header — M3 Top App Bar */}
      <header style={{
        background: CARD, borderBottom: "none",
        padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: `0 1px 3px ${SHADOW}`, position: "sticky", top: 0, zIndex: 20, height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={darkMode ? LOGO_URL_DARK : LOGO_URL} alt="Mustaneer" style={{ height: 32, width: "auto", objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
        </div>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 0, background: BG2, borderRadius: 20, padding: 4 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: isMobile ? "8px 14px" : "8px 22px", borderRadius: 16, border: "none",
              fontSize: isMobile ? 12 : 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1)",
              background: activeTab === tab.id ? TEAL : "transparent",
              color: activeTab === tab.id ? (darkMode ? "#111318" : "#FFFFFF") : TEXT_DIM, fontFamily: "inherit", letterSpacing: 0.1,
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={() => setDarkMode(d => !d)} style={{
            background: "transparent", border: "none", borderRadius: 20, width: 40, height: 40,
            color: TEXT_SEC, fontSize: 18, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{darkMode ? "light_mode" : "dark_mode"}</span>
          </button>
          <button onClick={() => setCurrency(c => c === "USD" ? "EGP" : "USD")} style={{
            background: currency === "USD" ? PRIMARY_CONTAINER : `${AMBER}25`,
            border: "none", borderRadius: 20, padding: "6px 14px",
            color: currency === "USD" ? (darkMode ? TEAL_LIGHT : TEAL) : AMBER,
            fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
            fontFamily: "inherit", letterSpacing: 0.3,
          }}>
            {currency === "USD" ? "$ USD" : "EGP \u062c.\u0645"}
          </button>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TEXT_DIM, fontWeight: 500, marginLeft: 4 }}>
              <Pulse color={GREEN} /> Live
            </div>
          )}
        </div>
      </header>

      {/* Live Ticker Bar — Google Finance Chips */}
      <div style={{
        background: BG, padding: "8px 20px",
        display: "flex", gap: 8, overflow: "auto", fontSize: 12, color: TEXT_DIM, borderBottom: `1px solid ${BORDER}20`,
      }}>
        {tickerData.map((t, i) => (
          <span key={i} style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: BG2, flexShrink: 0 }}>
            <span style={{ color: TEXT, fontWeight: 500, fontSize: 12 }}>{t.sym}</span>
            <span style={{ color: TEXT_SEC, fontSize: 12 }}>{t.val}</span>
            <span style={{ color: t.ch.startsWith("-") ? RED : GREEN, fontSize: 11, fontWeight: 500 }}>{t.ch}</span>
          </span>
        ))}
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} t={t} />

      {/* Content */}
      <main style={{ padding: activeTab === "agent" ? "8px 20px 0" : "20px 20px 48px", maxWidth: 1100, margin: "0 auto", animation: "mFadeIn 0.3s cubic-bezier(0.2, 0, 0, 1)", overflow: activeTab === "agent" ? "hidden" : undefined, flex: activeTab === "agent" ? 1 : undefined, display: activeTab === "agent" ? "flex" : undefined, flexDirection: activeTab === "agent" ? "column" : undefined, width: "100%", boxSizing: "border-box" }}>
        {activeTab === "portfolio" && renderPortfolio()}
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "agent" && renderAgent()}
      </main>
    </div>
  );
}
