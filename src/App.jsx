import { useState, useRef, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const THEMES = {
  dark: {
    TEAL: "#0D9488", TEAL_LIGHT: "#2DD4BF", TEAL_DARK: "#0F766E", EMERALD: "#059669",
    BG: "#05100E", BG2: "#071714", CARD: "#0A1F1B", CARD2: "#0D2924",
    BORDER: "#14403A", BORDER_LIGHT: "#1A5C53",
    TEXT: "#E8F5F2", TEXT_SEC: "#94B8B2", TEXT_DIM: "#5A8A82",
    RED: "#F87171", GREEN: "#34D399", WHITE: "#FFFFFF", AMBER: "#FBBF24",
  },
  light: {
    TEAL: "#0D9488", TEAL_LIGHT: "#0F766E", TEAL_DARK: "#0D9488", EMERALD: "#059669",
    BG: "#F8FAFB", BG2: "#EFF4F3", CARD: "#FFFFFF", CARD2: "#F1F7F6",
    BORDER: "#D1E3DF", BORDER_LIGHT: "#B8D4CE",
    TEXT: "#0F2B26", TEXT_SEC: "#3D6B62", TEXT_DIM: "#6B9B91",
    RED: "#DC2626", GREEN: "#059669", WHITE: "#FFFFFF", AMBER: "#D97706",
  },
};

const LOGO_URL = "https://pub-caa62f1b5ec34522975fc2acc07b5053.r2.dev/image%20(28).png";
const CLAUDE_LOGO = "https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png";

// Toast notification component
const Toast = ({ toasts, onDismiss, t }) => (
  <div style={{ position: "fixed", top: 70, right: 16, zIndex: 100, display: "flex", flexDirection: "column", gap: 8 }}>
    {toasts.map(toast => (
      <div key={toast.id} style={{
        background: toast.type === "error" ? `${t.RED}20` : toast.type === "warning" ? `${t.AMBER}15` : `${t.GREEN}15`,
        border: `1px solid ${toast.type === "error" ? t.RED : toast.type === "warning" ? t.AMBER : t.GREEN}40`,
        borderRadius: 10, padding: "10px 14px", minWidth: 260, maxWidth: 380,
        display: "flex", gap: 10, alignItems: "flex-start", animation: "mFadeIn 0.3s ease",
        backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
      }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>{toast.type === "error" ? "\u26D4" : toast.type === "warning" ? "\u26A0" : "\u2713"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: toast.type === "error" ? t.RED : toast.type === "warning" ? t.AMBER : t.GREEN, marginBottom: 2 }}>{toast.title}</div>
          <div style={{ fontSize: 11, color: t.TEXT_SEC, lineHeight: 1.4 }}>{toast.message}</div>
        </div>
        <button onClick={() => onDismiss(toast.id)} style={{ background: "none", border: "none", color: t.TEXT_DIM, cursor: "pointer", fontSize: 14, padding: 0 }}>{"\u00D7"}</button>
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

const SECTORS = ["Technology", "Financials", "Healthcare", "Energy", "Consumer Staples", "Real Estate", "Industrials", "Utilities", "Materials", "Communication Services", "Consumer Discretionary"];

const SECTOR_COLORS = {
  Technology: "#2DD4BF", Financials: "#34D399", Healthcare: "#F59E0B", Energy: "#FB923C",
  "Consumer Staples": "#A78BFA", "Real Estate": "#F472B6", Industrials: "#6EE7B7",
  Utilities: "#67E8F9", Materials: "#FCA5A5", "Communication Services": "#C084FC", "Consumer Discretionary": "#FDA4AF",
};

// Currency formatting — will be overridden inside component

export default function MustaneerInvestments() {
  const [darkMode, setDarkMode] = useState(() => {
    try { const s = localStorage.getItem("mustaneer_theme"); return s ? s === "dark" : true; } catch { return true; }
  });
  const t = THEMES[darkMode ? "dark" : "light"];
  const { TEAL, TEAL_LIGHT, TEAL_DARK, EMERALD, BG, BG2, CARD, CARD2, BORDER, BORDER_LIGHT, TEXT, TEXT_SEC, TEXT_DIM, RED, GREEN, WHITE, AMBER } = t;

  useEffect(() => { localStorage.setItem("mustaneer_theme", darkMode ? "dark" : "light"); }, [darkMode]);

  // Theme-aware helpers (defined inside component so they use current theme)
  const Pulse = ({ color = TEAL_LIGHT, size = 6 }) => (
    <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}80`, marginRight: 6, animation: "mPulse 2s infinite" }} />
  );
  const Card = ({ children, style = {}, glow = false }) => (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px", ...(glow ? { boxShadow: `0 0 24px ${TEAL}12, inset 0 1px 0 ${TEAL}10`, borderColor: BORDER_LIGHT } : {}), ...style }}>{children}</div>
  );
  const MetricBox = ({ label, value, change, prefix = "", suffix = "" }) => (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px", flex: "1 1 150px", minWidth: 140 }}>
      <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, fontVariantNumeric: "tabular-nums" }}>{prefix}{value}{suffix}</div>
      {change !== undefined && (
        <div style={{ fontSize: 11, color: change >= 0 ? GREEN : RED, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
          {change >= 0 ? "\u25B2" : "\u25BC"} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  );
  const SectionLabel = ({ children, right }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1.5 }}>{children}</div>
      {right && <div>{right}</div>}
    </div>
  );
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
  const [toasts, setToasts] = useState([]);
  const [watchlist, setWatchlist] = useState(() => {
    try { const s = localStorage.getItem("mustaneer_watchlist"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [newWatch, setNewWatch] = useState("");
  const [validating, setValidating] = useState(false);
  const chatEndRef = useRef(null);

  const EGP_RATE = 50;
  const cx = (n) => currency === "EGP" ? n * EGP_RATE : n; // convert
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
  const [liveQuotes, setLiveQuotes] = useState({});     // { AAPL: { price, change, changePercent, ... } }
  const [liveHistory, setLiveHistory] = useState({});    // { AAPL: [{ date, close }, ...] }
  const [liveIndices, setLiveIndices] = useState([]);    // [{ sym, val, change }]
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

  // ─── LOAD ALL DATA ───
  const refreshAllData = useCallback(async () => {
    const tickers = [...new Set(portfolio.map(h => h.ticker))];
    if (!tickers.length) return;
    setDataLoading(true);
    await Promise.all([fetchQuotes(tickers), fetchHistory(tickers), fetchIndices()]);
    setLastRefresh(new Date());
    setDataLoading(false);
  }, [portfolio, fetchQuotes, fetchHistory, fetchIndices]);

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
          system: `You are a senior investment analyst at Mustaneer Investments. You respond ENTIRELY in Egyptian Arabic (عامية مصرية) — casual, warm, and confident like a trusted financial advisor chatting with a friend at a Cairo café. Use Egyptian dialect naturally (مثلا: "كده", "يعني", "بص", "الموضوع ببساطة").

IMPORTANT LANGUAGE RULES:
- ALL responses must be in Egyptian Arabic (عامية مصرية), never formal Arabic (فصحى) and never English
- Use Arabic numerals and currency formatting (e.g., $142.50 is fine, but text must be Arabic)
- Financial terms can stay in English when there's no common Arabic equivalent (e.g., Sharpe ratio, P/E, VaR)
- Ticker symbols stay in English (AAPL, MSFT, etc.)
- Use **bold** for section headers (write headers in Arabic)

CLIENT PORTFOLIO (LIVE DATA):
${portfolioSummary}
Total Market Value: $${totalMarketValue.toLocaleString()}
Total Cost Basis: $${totalCostBasis.toLocaleString()}
Total P&L: $${totalPnL.toLocaleString()} (${totalPnLPercent >= 0 ? "+" : ""}${totalPnLPercent.toFixed(2)}%)
Sector Allocation: ${sectorSummary}

RESPONSE RULES:
- Prices shown above are LIVE from Yahoo Finance — use them as current data
- Search the web for breaking news and earnings when relevant
- Be quantitative: numbers, percentages, ratios always
- Give actionable recommendations with specific price targets
- Reference portfolio theory (Sharpe, beta, correlation, VaR)
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
  }, [input, messages, holdingsData, sectorData, totalMarketValue, totalCostBasis, totalPnL, totalPnLPercent]);

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
    background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8,
    padding: "9px 12px", color: TEXT, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.2s", fontFamily: "inherit", ...extra
  });
  const btn = (bg, clr, extra = {}) => ({
    background: bg, border: "none", borderRadius: 8, padding: "9px 16px",
    color: clr, fontWeight: 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", fontFamily: "inherit", ...extra
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "6px 10px" : "8px 14px", background: `${dataLoading ? TEAL : GREEN}08`, border: `1px solid ${dataLoading ? TEAL : GREEN}20`, borderRadius: 8, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: dataLoading ? TEAL_LIGHT : GREEN }}>
          <Pulse color={dataLoading ? TEAL_LIGHT : GREEN} />
          {dataLoading ? "Fetching live data..." : `Live · ${Object.keys(liveQuotes).length} tickers`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastRefresh && !isMobile && <span style={{ fontSize: 10, color: TEXT_DIM }}>Updated {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={refreshAllData} disabled={dataLoading} style={btn(`${TEAL}18`, TEAL_LIGHT, { padding: "4px 12px", fontSize: 10, opacity: dataLoading ? 0.4 : 1 })}>
            {"\u21BB"} Refresh
          </button>
        </div>
      </div>

      <Card glow>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", marginBottom: 16, flexWrap: "wrap", gap: 10, flexDirection: isMobile ? "column" : "row" }}>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: TEXT }}>Portfolio Holdings</div>
            <div style={{ fontSize: isMobile ? 11 : 12, color: TEXT_DIM, marginTop: 2 }}>
              {portfolio.length} positions {"\u00B7"} {fmtC(totalMarketValue)} {"\u00B7"} <span style={{ color: totalPnL >= 0 ? GREEN : RED }}>{totalPnL >= 0 ? "+" : ""}{fmtC(totalPnL)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={exportCSV} style={btn(`${TEAL}20`, TEAL_LIGHT, { padding: isMobile ? "6px 10px" : undefined, fontSize: isMobile ? 10 : 11 })}>{"\u2913"} Export</button>
            <button onClick={() => setPortfolio(DEFAULT_PORTFOLIO)} style={btn(`${TEAL}20`, TEAL_LIGHT, { padding: isMobile ? "6px 10px" : undefined, fontSize: isMobile ? 10 : 11 })}>Sample</button>
            <button onClick={() => setPortfolio([])} style={btn(`${RED}15`, RED, { padding: isMobile ? "6px 10px" : undefined, fontSize: isMobile ? 10 : 11 })}>Clear</button>
            {!isMobile && <button onClick={() => setActiveTab("dashboard")} style={btn(TEAL, BG)}>View Dashboard {"\u2192"}</button>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", padding: 14, background: `${TEAL}06`, borderRadius: 8, border: `1px dashed ${BORDER}`, marginBottom: 14 }}>
          <div style={{ flex: "1 1 120px", minWidth: 90 }}>
            <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Ticker</div>
            <input value={newRow.ticker} onChange={e => setNewRow(p => ({ ...p, ticker: e.target.value }))} placeholder="AAPL" style={inp()} onKeyDown={e => e.key === "Enter" && addHolding()} />
          </div>
          <div style={{ flex: "1 1 90px", minWidth: 70 }}>
            <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Shares</div>
            <input value={newRow.shares} onChange={e => setNewRow(p => ({ ...p, shares: e.target.value }))} placeholder="100" type="number" style={inp()} onKeyDown={e => e.key === "Enter" && addHolding()} />
          </div>
          <div style={{ flex: "1 1 90px", minWidth: 70 }}>
            <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Avg Cost</div>
            <input value={newRow.avgCost} onChange={e => setNewRow(p => ({ ...p, avgCost: e.target.value }))} placeholder="150.00" type="number" step="0.01" style={inp()} onKeyDown={e => e.key === "Enter" && addHolding()} />
          </div>
          <div style={{ flex: "1 1 130px", minWidth: 110 }}>
            <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Sector</div>
            <select value={newRow.sector} onChange={e => setNewRow(p => ({ ...p, sector: e.target.value }))} style={inp({ cursor: "pointer" })}>
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={addHolding} disabled={validating} style={btn(TEAL, BG, { padding: "9px 22px", opacity: validating ? 0.5 : 1 })}>{validating ? "Checking..." : "Add Position"}</button>
        </div>

        {portfolio.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: TEXT_DIM }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${TEAL}10`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <svg width="24" height="24" fill="none" stroke={TEAL} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6v12m-6-6h12" strokeLinecap="round" /></svg>
            </div>
            <div style={{ fontSize: 14, marginBottom: 4 }}>No holdings yet</div>
            <div style={{ fontSize: 12 }}>Add positions above or load sample data</div>
          </div>
        ) : isMobile ? (
          /* ─── MOBILE CARD LAYOUT ─── */
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {holdingsData.map((h, i) => (
              <div key={i} style={{ background: `${BG2}80`, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
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
                { label: "Full Risk Analysis", q: "Analyze my current portfolio risk and give me a full risk report" },
                { label: "Rebalancing Recommendations", q: "What rebalancing moves should I make right now? Be specific with share counts." },
                { label: "Executive Summary", q: "Generate a CFO-level executive portfolio summary with key metrics and outlook." },
                { label: "News Impact Analysis", q: "Search for the latest market news affecting my portfolio holdings and assess impact." },
              ].map((item, i) => (
                <button key={i} onClick={() => sendMessage(item.q)} style={{
                  background: `${TEAL}08`, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "11px 14px",
                  color: TEXT_SEC, fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.color = TEAL_LIGHT; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT_SEC; }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL, opacity: 0.6, flexShrink: 0 }} />
                  {item.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  // ─── DASHBOARD TAB ───
  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <MetricBox label={`Market Value (${currency})`} value={fmt(cx(totalMarketValue))} prefix={csym} change={totalPnLPercent} />
        <MetricBox label={`Total P&L (${currency})`} value={`${totalPnL >= 0 ? "+" : ""}${fmt(cx(totalPnL))}`} prefix={csym} change={totalPnLPercent} />
        <MetricBox label={`Cost Basis (${currency})`} value={fmt(cx(totalCostBasis))} prefix={csym} />
        <MetricBox label="Positions" value={portfolio.length} />
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <Card style={{ flex: "2 1 320px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <SectionLabel>Portfolio Value (30D Live)</SectionLabel>
          </div>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performanceData}>
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
              <Pie data={sectorData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {sectorData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip contentStyle={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: TEXT }} formatter={(v, _, p) => [`${v}% · ${fmtC(p.payload.amount)}`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sectorData.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: TEXT_DIM }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: s.color, display: "inline-block" }} />{s.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionLabel>Holdings Overview — Live Data</SectionLabel>
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {holdingsData.map((h, i) => (
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
                  <div><span style={{ color: TEXT_DIM, fontSize: 10 }}>Weight </span><span style={{ color: TEXT_SEC }}>{(h.marketValue / totalMarketValue * 100).toFixed(1)}%</span></div>
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
                {holdingsData.map((h, i) => (
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
                    <td style={{ padding: "8px 8px", color: TEXT_DIM, fontVariantNumeric: "tabular-nums" }}>{(h.marketValue / totalMarketValue * 100).toFixed(1)}%</td>
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
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 110px)", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 0" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: isMobile ? "30px 12px" : "50px 16px" }}>
            <img src={CLAUDE_LOGO} alt="Claude" style={{ width: 48, height: 48, borderRadius: 14, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
            <div style={{ fontSize: 19, fontWeight: 700, color: TEXT, marginBottom: 6 }}>Investment Analyst</div>
            <div style={{ fontSize: 10, color: TEXT_DIM, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>Powered by Claude <img src={CLAUDE_LOGO} alt="Claude" style={{ height: 16, objectFit: "contain" }} /></div>
            <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 28, maxWidth: 440, margin: "0 auto 28px" }}>
              AI-powered portfolio analysis with <strong style={{ color: GREEN }}>live market data</strong> and real-time intelligence
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520, margin: "0 auto" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "7px 13px",
                  color: TEXT_DIM, fontSize: 11, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit"
                }}
                  onMouseEnter={e => { e.target.style.borderColor = TEAL; e.target.style.color = TEAL_LIGHT; }}
                  onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = TEXT_DIM; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10, padding: "0 4px" }}>
            <div style={{
              maxWidth: isMobile ? "94%" : "85%", padding: "11px 15px", borderRadius: 10,
              background: m.role === "user" ? `${TEAL}12` : CARD,
              border: `1px solid ${m.role === "user" ? `${TEAL}25` : BORDER}`,
              color: m.role === "user" ? TEXT : TEXT_SEC, fontSize: 13, lineHeight: 1.6
            }}>
              {m.role === "assistant" ? (
                <div>
                  <div style={{ fontSize: 10, color: TEAL, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", direction: "ltr" }}>
                    <Pulse /> Powered by Claude <img src={CLAUDE_LOGO} alt="" style={{ height: 12, objectFit: "contain", marginLeft: 4 }} />
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
          <div style={{ display: "flex", padding: "0 4px", marginBottom: 10 }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 15px" }}>
              <div style={{ fontSize: 10, color: TEAL, marginBottom: 5, textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center" }}>
                <Pulse /> Powered by Claude
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 12, color: TEXT_DIM }}>
                Analyzing market data
                {[0, 1, 2].map(j => <span key={j} style={{ animation: `mBlink 1.4s ${j * 0.2}s infinite`, opacity: 0 }}>.</span>)}
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ padding: "8px 0 0", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={btn(`${RED}15`, RED, { borderRadius: 10, padding: "11px 14px", fontSize: 11 })} title="New Chat">
              {"\u2715"}
            </button>
          )}
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !loading && sendMessage()}
            placeholder={isMobile ? "Ask anything..." : "Ask about your portfolio, market conditions, risk..."}
            style={inp({ flex: 1, borderRadius: 10, padding: isMobile ? "10px 12px" : "11px 14px", fontSize: 16 })}
            onFocus={e => e.target.style.borderColor = TEAL}
            onBlur={e => e.target.style.borderColor = BORDER}
            disabled={loading}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={btn(TEAL, BG, { borderRadius: 10, padding: "11px 22px", opacity: loading || !input.trim() ? 0.4 : 1 })}>
            Send
          </button>
        </div>
      </div>
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
      { sym: "SPX", val: "—", ch: "—" },
      { sym: "NDX", val: "—", ch: "—" },
      { sym: "DJI", val: "—", ch: "—" },
      { sym: "VIX", val: "—", ch: "—" },
    ];

  return (
    <div style={{ background: BG, minHeight: "100vh", height: activeTab === "agent" ? "100dvh" : undefined, overflow: activeTab === "agent" ? "hidden" : undefined, color: TEXT, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", opacity: animateIn ? 1 : 0, transition: "opacity 0.6s ease", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes mPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes mFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mBlink { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
        select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%235A8A82' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 28px !important; }
        select option { background: ${CARD}; color: ${TEXT}; }
        body { margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <header style={{
        background: `${CARD}ee`, borderBottom: `1px solid ${BORDER}`,
        padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
        backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 20, height: 54,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_URL} alt="Mustaneer" style={{ height: 34, width: "auto", borderRadius: 5 }} onError={e => { e.target.style.display = "none"; }} />
          {!isMobile && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, letterSpacing: -0.3 }}>Mustaneer Investments</div>
              <div style={{ fontSize: 9, color: TEAL, textTransform: "uppercase", letterSpacing: 1.2, marginTop: -1 }}>AI Portfolio Intelligence</div>
            </div>
          )}
        </div>

        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3, background: BG2, borderRadius: 8, padding: 3, border: `1px solid ${BORDER}` }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: isMobile ? "7px 12px" : "7px 18px", borderRadius: 6, border: "none",
              fontSize: isMobile ? 11 : 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              background: activeTab === tab.id ? TEAL : "transparent",
              color: activeTab === tab.id ? BG : TEXT_DIM, fontFamily: "inherit"
            }}>{tab.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setDarkMode(d => !d)} style={{
            background: `${TEAL}15`, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px",
            color: TEAL_LIGHT, fontSize: 13, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
          }}>
            {darkMode ? "\u2600" : "\u263E"}
          </button>
          <button onClick={() => setCurrency(c => c === "USD" ? "EGP" : "USD")} style={{
            background: `${TEAL}15`, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px",
            color: TEAL_LIGHT, fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            fontFamily: "inherit", letterSpacing: 0.5,
          }}>
            {currency === "USD" ? "$ USD" : "£ EGP"}
          </button>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: TEXT_DIM }}>
              <Pulse color={GREEN} /> Live
            </div>
          )}
        </div>
      </header>

      {/* Live Ticker Bar */}
      <div style={{
        background: BG2, borderBottom: `1px solid ${BORDER}08`, padding: "5px 16px",
        display: "flex", gap: isMobile ? 14 : 20, overflow: "hidden", fontSize: 10, color: TEXT_DIM
      }}>
        {tickerData.map((t, i) => (
          <span key={i} style={{ whiteSpace: "nowrap" }}>
            <span style={{ color: TEXT_SEC, fontWeight: 600 }}>{t.sym}</span>{" "}{t.val}{" "}
            <span style={{ color: t.ch.startsWith("-") ? RED : GREEN }}>{t.ch}</span>
          </span>
        ))}
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} t={t} />

      {/* Content */}
      <main style={{ padding: activeTab === "agent" ? "8px 16px 0" : "16px 16px 40px", maxWidth: 1100, margin: "0 auto", animation: "mFadeIn 0.5s ease", overflow: activeTab === "agent" ? "hidden" : undefined, flex: activeTab === "agent" ? 1 : undefined, display: activeTab === "agent" ? "flex" : undefined, flexDirection: activeTab === "agent" ? "column" : undefined, width: "100%", boxSizing: "border-box" }}>
        {activeTab === "portfolio" && renderPortfolio()}
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "agent" && renderAgent()}
      </main>
    </div>
  );
}
