import { useState, useEffect, useRef, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  BubbleController,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Bubble, Doughnut, Line, Radar, Scatter } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  BubbleController,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const COIN_IDS =
  "bitcoin,ethereum,tether,ripple,binancecoin,usd-coin,solana,tron,dogecoin,cardano";
const API_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`;

const PALETTE = [
  "#f7931a",
  "#627eea",
  "#26a17b",
  "#346aa9",
  "#f3ba2f",
  "#2775ca",
  "#9945ff",
  "#eb2539",
  "#c2a633",
  "#0033ad",
];

const CHART_TABS = [
  "Bar",
  "Bubble",
  "Doughnut",
  "Line",
  "Mixed",
  "Radar",
  "Scatter",
];

const fmt = (n) => {
  if (!n && n !== 0) return "—";
  if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  return "$" + n.toLocaleString();
};

const pct = (n) => {
  if (n == null) return "—";
  return (n > 0 ? "▲" : "▼") + Math.abs(n).toFixed(2) + "%";
};

export default function CryptoDashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Bar");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortKey, setSortKey] = useState("market_cap");
  const [sortDir, setSortDir] = useState("desc");
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const sorted = [...coins].sort((a, b) => {
    const av = a[sortKey] ?? 0,
      bv = b[sortKey] ?? 0;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const labels = coins.map((c) => c.symbol?.toUpperCase());

  /* ── chart datasets ── */
  const barData = {
    labels,
    datasets: [
      {
        label: "Market Cap (B USD)",
        data: coins.map((c) => +(c.market_cap / 1e9).toFixed(2)),
        backgroundColor: PALETTE,
        borderColor: PALETTE,
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const bubbleData = {
    datasets: coins.map((c, i) => ({
      label: c.symbol?.toUpperCase(),
      data: [
        {
          x: +(c.price_change_percentage_24h || 0).toFixed(2),
          y: +(
            c.price_change_percentage_7d_in_currency ||
            c.price_change_percentage_7d ||
            0
          ).toFixed(2),
          r: Math.max(5, Math.min(40, Math.sqrt(c.market_cap / 1e9) * 2)),
        },
      ],
      backgroundColor: PALETTE[i] + "99",
      borderColor: PALETTE[i],
      borderWidth: 2,
    })),
  };

  const doughnutData = {
    labels,
    datasets: [
      {
        data: coins.map((c) => +(c.market_cap / 1e9).toFixed(2)),
        backgroundColor: PALETTE.map((c) => c + "cc"),
        borderColor: PALETTE,
        borderWidth: 2,
        hoverOffset: 16,
      },
    ],
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: "24h Change %",
        data: coins.map(
          (c) => +(c.price_change_percentage_24h || 0).toFixed(2),
        ),
        borderColor: "#00e5ff",
        backgroundColor: "#00e5ff22",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: PALETTE,
        pointRadius: 6,
      },
      {
        label: "1h Change %",
        data: coins.map(
          (c) => +(c.price_change_percentage_1h_in_currency || 0).toFixed(2),
        ),
        borderColor: "#ff6b6b",
        backgroundColor: "#ff6b6b22",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#ff6b6b",
        pointRadius: 4,
      },
    ],
  };

  const mixedData = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "24h Volume (B)",
        data: coins.map((c) => +(c.total_volume / 1e9).toFixed(2)),
        backgroundColor: PALETTE.map((c) => c + "88"),
        borderColor: PALETTE,
        borderWidth: 2,
        yAxisID: "y",
        borderRadius: 4,
      },
      {
        type: "line",
        label: "Current Price (USD)",
        data: coins.map((c) => +c.current_price.toFixed(2)),
        borderColor: "#ffe066",
        backgroundColor: "transparent",
        tension: 0.4,
        yAxisID: "y1",
        pointBackgroundColor: "#ffe066",
        pointRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const radarData = {
    labels,
    datasets: [
      {
        label: "Market Cap Score",
        data: coins.map((c) =>
          Math.min(100, +(c.market_cap / 1e10).toFixed(1)),
        ),
        backgroundColor: "#00e5ff33",
        borderColor: "#00e5ff",
        pointBackgroundColor: "#00e5ff",
        borderWidth: 2,
      },
      {
        label: "Volume Score",
        data: coins.map((c) =>
          Math.min(100, +(c.total_volume / 1e9).toFixed(1)),
        ),
        backgroundColor: "#ff6b6b33",
        borderColor: "#ff6b6b",
        pointBackgroundColor: "#ff6b6b",
        borderWidth: 2,
      },
    ],
  };

  const scatterData = {
    datasets: coins.map((c, i) => ({
      label: c.symbol?.toUpperCase(),
      data: [
        {
          x: +(c.total_volume / 1e9).toFixed(2),
          y: +(c.market_cap / 1e9).toFixed(2),
        },
      ],
      backgroundColor: PALETTE[i] + "cc",
      borderColor: PALETTE[i],
      pointRadius: 8,
      pointHoverRadius: 12,
    })),
  };

  const darkOptions = (extra = {}) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#a0aec0",
          font: { family: "'Space Mono', monospace", size: 11 },
        },
      },
      tooltip: {
        backgroundColor: "#0d1117",
        borderColor: "#30363d",
        borderWidth: 1,
        titleColor: "#e6edf3",
        bodyColor: "#a0aec0",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#a0aec0",
          font: { family: "'Space Mono', monospace", size: 10 },
        },
        grid: { color: "#21262d" },
      },
      y: {
        ticks: {
          color: "#a0aec0",
          font: { family: "'Space Mono', monospace", size: 10 },
        },
        grid: { color: "#21262d" },
      },
      ...extra,
    },
  });

  const noScaleOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#a0aec0",
          font: { family: "'Space Mono', monospace", size: 11 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#0d1117",
        borderColor: "#30363d",
        borderWidth: 1,
        titleColor: "#e6edf3",
        bodyColor: "#a0aec0",
      },
    },
  });

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#a0aec0",
          font: { family: "'Space Mono', monospace", size: 11 },
        },
      },
      tooltip: {
        backgroundColor: "#0d1117",
        borderColor: "#30363d",
        borderWidth: 1,
        titleColor: "#e6edf3",
        bodyColor: "#a0aec0",
      },
    },
    scales: {
      r: {
        ticks: {
          color: "#a0aec0",
          backdropColor: "transparent",
          font: { size: 9 },
        },
        grid: { color: "#21262d" },
        pointLabels: {
          color: "#a0aec0",
          font: { family: "'Space Mono', monospace", size: 10 },
        },
      },
    },
  };

  const renderChart = () => {
    const h = "100%";
    switch (activeTab) {
      case "Bar":
        return (
          <Bar data={barData} options={darkOptions()} style={{ height: h }} />
        );
      case "Bubble":
        return (
          <Bubble
            data={bubbleData}
            options={{
              ...darkOptions(),
              plugins: { ...darkOptions().plugins },
            }}
            style={{ height: h }}
          />
        );
      case "Doughnut":
        return (
          <Doughnut
            data={doughnutData}
            options={noScaleOptions()}
            style={{ height: h }}
          />
        );
      case "Line":
        return (
          <Line data={lineData} options={darkOptions()} style={{ height: h }} />
        );
      case "Mixed":
        return (
          <Bar
            data={mixedData}
            options={darkOptions({
              y: {
                position: "left",
                ticks: { color: "#a0aec0", font: { size: 10 } },
                grid: { color: "#21262d" },
              },
              y1: {
                position: "right",
                ticks: { color: "#ffe066", font: { size: 10 } },
                grid: { drawOnChartArea: false },
              },
            })}
            style={{ height: h }}
          />
        );
      case "Radar":
        return (
          <Radar
            data={radarData}
            options={radarOptions}
            style={{ height: h }}
          />
        );
      case "Scatter":
        return (
          <Scatter
            data={scatterData}
            options={{
              ...darkOptions(),
              plugins: {
                ...darkOptions().plugins,
                tooltip: {
                  ...darkOptions().plugins.tooltip,
                  callbacks: {
                    label: (ctx) =>
                      `${ctx.dataset.label}: Vol=${ctx.parsed.x}B, MCap=${ctx.parsed.y}B`,
                  },
                },
              },
            }}
            style={{ height: h }}
          />
        );
      default:
        return null;
    }
  };

  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060910; }

    .dash { background: #060910; min-height: 100vh; padding: 24px; font-family: 'Space Mono', monospace; color: #e6edf3; }

    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-dot { width: 10px; height: 10px; border-radius: 50%; background: #f7931a; box-shadow: 0 0 16px #f7931a; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:.5; transform:scale(1.3); } }
    .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; background: linear-gradient(90deg,#f7931a,#ffe066); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .sub { font-size: 11px; color: #4a5568; margin-top: 2px; }

    .meta { display: flex; align-items: center; gap: 16px; }
    .live-badge { display: flex; align-items: center; gap: 6px; background: #0d1117; border: 1px solid #21262d; border-radius: 20px; padding: 6px 14px; font-size: 11px; color: #56d364; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #56d364; animation: pulse 1.5s infinite; }
    .last-updated { font-size: 10px; color: #4a5568; }

    .refresh-btn { background: linear-gradient(135deg, #1a1f2e, #21262d); border: 1px solid #30363d; color: #a0aec0; padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 11px; font-family: 'Space Mono', monospace; transition: all 0.2s; }
    .refresh-btn:hover { border-color: #f7931a; color: #f7931a; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 28px; }
    .stat-card { background: #0d1117; border: 1px solid #21262d; border-radius: 12px; padding: 16px; transition: border-color 0.2s; }
    .stat-card:hover { border-color: #f7931a44; }
    .stat-label { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .stat-val { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: #e6edf3; }
    .stat-sub { font-size: 10px; color: #4a5568; margin-top: 2px; }

    .section-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; color: #a0aec0; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 14px; }

    /* TABLE */
    .table-wrap { overflow-x: auto; border: 1px solid #21262d; border-radius: 14px; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { background: #0d1117; color: #4a5568; text-transform: uppercase; letter-spacing: 1px; padding: 12px 14px; text-align: right; cursor: pointer; white-space: nowrap; user-select: none; border-bottom: 1px solid #21262d; font-size: 10px; }
    thead th:first-child, thead th:nth-child(2) { text-align: left; }
    thead th:hover { color: #a0aec0; }
    tbody tr { border-bottom: 1px solid #21262d11; transition: background 0.15s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #ffffff05; }
    td { padding: 11px 14px; text-align: right; color: #a0aec0; white-space: nowrap; }
    td:first-child { text-align: left; color: #4a5568; font-size: 11px; }
    td:nth-child(2) { text-align: left; }
    .coin-cell { display: flex; align-items: center; gap: 10px; }
    .coin-icon { width: 28px; height: 28px; border-radius: 50%; }
    .coin-name { color: #e6edf3; font-weight: 700; font-size: 13px; }
    .coin-sym { color: #4a5568; font-size: 10px; margin-top: 1px; }
    .pos-pct { color: #56d364; }
    .neg-pct { color: #f87171; }
    .price-cell { color: #e6edf3; font-weight: 700; }

    /* CHARTS */
    .charts-panel { background: #0d1117; border: 1px solid #21262d; border-radius: 14px; overflow: hidden; }
    .tabs { display: flex; border-bottom: 1px solid #21262d; overflow-x: auto; }
    .tab-btn { background: none; border: none; color: #4a5568; font-family: 'Space Mono', monospace; font-size: 11px; padding: 14px 20px; cursor: pointer; white-space: nowrap; letter-spacing: 0.5px; transition: all 0.2s; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn:hover { color: #a0aec0; background: #ffffff05; }
    .tab-btn.active { color: #f7931a; border-bottom-color: #f7931a; background: #f7931a08; }
    .chart-area { padding: 24px; height: 400px; position: relative; }
    .chart-desc { font-size: 10px; color: #4a5568; margin-bottom: 16px; font-style: italic; }

    .loading { display: flex; align-items: center; justify-content: center; height: 200px; color: #4a5568; font-size: 13px; gap: 10px; }
    .spinner { width: 18px; height: 18px; border: 2px solid #21262d; border-top-color: #f7931a; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg { color: #f87171; text-align: center; padding: 40px; font-size: 12px; }
  `;

  const chartDescs = {
    Bar: "Market capitalization comparison across top 10 cryptocurrencies.",
    Bubble:
      "X = 24h change%, Y = 7d change%, bubble size = market cap. Identifies momentum & volume leaders.",
    Doughnut:
      "Proportional market cap distribution. Bitcoin's dominance is front and center.",
    Line: "1h and 24h price change % overlay — spot short-term momentum shifts.",
    Mixed:
      "Bar = 24h trading volume (left axis) | Line = current price USD (right axis).",
    Radar:
      "Market Cap Score vs Volume Score per coin. Larger polygon = stronger overall presence.",
    Scatter:
      "X = 24h volume (B) vs Y = market cap (B). Reveals liquidity vs size relationships.",
  };

  const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
  const totalVol = coins.reduce((s, c) => s + (c.total_volume || 0), 0);
  const btc = coins.find((c) => c.id === "bitcoin");

  return (
    <>
      <style>{style}</style>
      <div className="dash">
        {/* Header */}
        <div className="header">
          <div className="logo">
            <div className="logo-dot" />
            <div>
              <div className="logo-text">CRYPTO TERMINAL</div>
              <div className="sub">
                Powered by CoinGecko API · Auto-refresh 30s
              </div>
            </div>
          </div>
          <div className="meta">
            <div className="live-badge">
              <div className="live-dot" /> LIVE
            </div>
            {lastUpdated && (
              <div className="last-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <button className="refresh-btn" onClick={fetchData}>
              ↺ Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {coins.length > 0 && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Market Cap</div>
              <div className="stat-val">{fmt(totalMcap)}</div>
              <div className="stat-sub">Top 10 coins</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">24h Volume</div>
              <div className="stat-val">{fmt(totalVol)}</div>
              <div className="stat-sub">Aggregate</div>
            </div>
            {btc && (
              <>
                <div className="stat-card">
                  <div className="stat-label">BTC Price</div>
                  <div className="stat-val">{fmt(btc.current_price)}</div>
                  <div
                    className="stat-sub"
                    style={{
                      color:
                        btc.price_change_percentage_24h >= 0
                          ? "#56d364"
                          : "#f87171",
                    }}
                  >
                    {pct(btc.price_change_percentage_24h)} (24h)
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">BTC Dominance</div>
                  <div className="stat-val">
                    {((btc.market_cap / totalMcap) * 100).toFixed(1)}%
                  </div>
                  <div className="stat-sub">of top 10</div>
                </div>
              </>
            )}
            <div className="stat-card">
              <div className="stat-label">Gainers (24h)</div>
              <div className="stat-val" style={{ color: "#56d364" }}>
                {coins.filter((c) => c.price_change_percentage_24h > 0).length}
              </div>
              <div className="stat-sub">out of {coins.length} coins</div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="section-title">Market Overview</div>
        <div className="table-wrap">
          {loading ? (
            <div className="loading">
              <div className="spinner" /> Fetching live market data…
            </div>
          ) : error ? (
            <div className="error-msg">
              ⚠ API Error: {error}
              <br />
              <span style={{ color: "#4a5568", fontSize: 11 }}>
                CoinGecko rate limit may apply. Try refreshing in 60s.
              </span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Coin</th>
                  <th onClick={() => handleSort("current_price")}>
                    Price{" "}
                    {sortKey === "current_price"
                      ? sortDir === "desc"
                        ? "↓"
                        : "↑"
                      : ""}
                  </th>
                  <th>1h %</th>
                  <th onClick={() => handleSort("price_change_percentage_24h")}>
                    24h %{" "}
                    {sortKey === "price_change_percentage_24h"
                      ? sortDir === "desc"
                        ? "↓"
                        : "↑"
                      : ""}
                  </th>
                  <th>7d %</th>
                  <th onClick={() => handleSort("total_volume")}>
                    24h Volume{" "}
                    {sortKey === "total_volume"
                      ? sortDir === "desc"
                        ? "↓"
                        : "↑"
                      : ""}
                  </th>
                  <th onClick={() => handleSort("market_cap")}>
                    Market Cap{" "}
                    {sortKey === "market_cap"
                      ? sortDir === "desc"
                        ? "↓"
                        : "↑"
                      : ""}
                  </th>
                  <th onClick={() => handleSort("circulating_supply")}>
                    Circulating Supply{" "}
                    {sortKey === "circulating_supply"
                      ? sortDir === "desc"
                        ? "↓"
                        : "↑"
                      : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => {
                  const p1h = c.price_change_percentage_1h_in_currency;
                  const p24 = c.price_change_percentage_24h;
                  const p7d = c.price_change_percentage_7d_in_currency;
                  return (
                    <tr key={c.id}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="coin-cell">
                          <img
                            className="coin-icon"
                            src={c.image}
                            alt={c.name}
                          />
                          <div>
                            <div className="coin-name">{c.name}</div>
                            <div className="coin-sym">
                              {c.symbol?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="price-cell">
                        ${c.current_price?.toLocaleString()}
                      </td>
                      <td className={p1h >= 0 ? "pos-pct" : "neg-pct"}>
                        {pct(p1h)}
                      </td>
                      <td className={p24 >= 0 ? "pos-pct" : "neg-pct"}>
                        {pct(p24)}
                      </td>
                      <td className={p7d >= 0 ? "pos-pct" : "neg-pct"}>
                        {pct(p7d)}
                      </td>
                      <td>{fmt(c.total_volume)}</td>
                      <td>{fmt(c.market_cap)}</td>
                      <td>
                        {c.circulating_supply
                          ? (c.circulating_supply / 1e6).toFixed(2) +
                            "M " +
                            c.symbol?.toUpperCase()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Charts */}
        {!loading && !error && (
          <>
            <div className="section-title">Chart Analysis</div>
            <div className="charts-panel">
              <div className="tabs">
                {CHART_TABS.map((t) => (
                  <button
                    key={t}
                    className={`tab-btn${activeTab === t ? " active" : ""}`}
                    onClick={() => setActiveTab(t)}
                  >
                    {t === "Bar"
                      ? "📊"
                      : t === "Bubble"
                        ? "🫧"
                        : t === "Doughnut"
                          ? "🍩"
                          : t === "Line"
                            ? "📈"
                            : t === "Mixed"
                              ? "🔀"
                              : t === "Radar"
                                ? "🕸"
                                : "✦"}{" "}
                    {t}
                  </button>
                ))}
              </div>
              <div className="chart-area">
                <div className="chart-desc">{chartDescs[activeTab]}</div>
                {renderChart()}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
