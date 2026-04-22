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

const FILTERS = [
  { key: "current_price", label: "Price (USD)", prefix: "$", suffix: "" },
  {
    key: "market_cap",
    label: "Market Cap",
    prefix: "$",
    suffix: "B",
    divisor: 1e9,
  },
  {
    key: "total_volume",
    label: "24h Volume",
    prefix: "$",
    suffix: "B",
    divisor: 1e9,
  },
  {
    key: "price_change_percentage_24h",
    label: "24h Change %",
    prefix: "",
    suffix: "%",
  },
];

function RangeSlider({ label, min, max, value, onChange, prefix, suffix }) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value]);

  const handleMinChange = (e) => {
    const v = parseFloat(e.target.value);
    const newMin = Math.min(v, localMax - 0.01);
    setLocalMin(newMin);
    onChange([newMin, localMax]);
  };
  const handleMaxChange = (e) => {
    const v = parseFloat(e.target.value);
    const newMax = Math.max(v, localMin + 0.01);
    setLocalMax(newMax);
    onChange([localMin, newMax]);
  };

  const rangePercMin = ((localMin - min) / (max - min)) * 100;
  const rangePercMax = ((localMax - min) / (max - min)) * 100;
  const isActive = localMin > min || localMax < max;

  return (
    <div className={`filter-card ${isActive ? "active" : ""}`}>
      <div className="filter-header">
        <span className="filter-label">{label}</span>
        {isActive && (
          <button
            className="reset-btn"
            onClick={() => {
              setLocalMin(min);
              setLocalMax(max);
              onChange([min, max]);
            }}
          >
            ✕ Reset
          </button>
        )}
      </div>
      <div className="range-values">
        <span className="range-val">
          {prefix}
          {typeof localMin === "number"
            ? localMin.toFixed(localMin < 10 ? 2 : 0)
            : localMin}
          {suffix}
        </span>
        <span className="range-sep">→</span>
        <span className="range-val">
          {prefix}
          {typeof localMax === "number"
            ? localMax.toFixed(localMax < 10 ? 2 : 0)
            : localMax}
          {suffix}
        </span>
      </div>
      <div className="slider-wrap">
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{
              left: `${rangePercMin}%`,
              width: `${rangePercMax - rangePercMin}%`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 200}
          value={localMin}
          onChange={handleMinChange}
          className="range-input"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 200}
          value={localMax}
          onChange={handleMaxChange}
          className="range-input"
        />
      </div>
      <div className="range-extremes">
        <span>
          {prefix}
          {min.toFixed(0)}
          {suffix}
        </span>
        <span>
          {prefix}
          {max.toFixed(0)}
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default function CryptoDashboard() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sortKey, setSortKey] = useState("market_cap");
  const [sortDir, setSortDir] = useState("desc");
  const [filterRanges, setFilterRanges] = useState({});
  const [filterLimits, setFilterLimits] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Bar");
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
      setError(null);
      const limits = {},
        ranges = {};
      FILTERS.forEach(({ key, divisor }) => {
        const vals = data
          .map((c) => {
            const v = c[key] ?? 0;
            return divisor ? v / divisor : v;
          })
          .filter((v) => isFinite(v));
        const mn = Math.floor(Math.min(...vals) * 10) / 10;
        const mx = Math.ceil(Math.max(...vals) * 10) / 10;
        limits[key] = [mn, mx];
        ranges[key] = [mn, mx];
      });
      setFilterLimits(limits);
      setFilterRanges((prev) =>
        Object.keys(prev).length === 0 ? ranges : prev,
      );
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

  const isFiltered = Object.keys(filterRanges).some((key) => {
    const lim = filterLimits[key],
      rng = filterRanges[key];
    if (!lim || !rng) return false;
    return rng[0] > lim[0] || rng[1] < lim[1];
  });

  const activeFilterCount = Object.keys(filterRanges).filter((key) => {
    const lim = filterLimits[key],
      rng = filterRanges[key];
    if (!lim || !rng) return false;
    return rng[0] > lim[0] || rng[1] < lim[1];
  }).length;

  const filteredCoins = coins.filter((coin) =>
    FILTERS.every(({ key, divisor }) => {
      const rng = filterRanges[key];
      if (!rng) return true;
      const v = coin[key] ?? 0;
      const val = divisor ? v / divisor : v;
      return val >= rng[0] && val <= rng[1];
    }),
  );

  const sorted = [...filteredCoins].sort((a, b) => {
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
          y: +(c.price_change_percentage_7d_in_currency || 0).toFixed(2),
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

  const renderChart = () => {
    switch (activeTab) {
      case "Bar":
        return (
          <Bar
            data={barData}
            options={darkOptions()}
            style={{ height: "100%" }}
          />
        );
      case "Bubble":
        return (
          <Bubble
            data={bubbleData}
            options={darkOptions()}
            style={{ height: "100%" }}
          />
        );
      case "Doughnut":
        return (
          <Doughnut
            data={doughnutData}
            options={noScaleOptions()}
            style={{ height: "100%" }}
          />
        );
      case "Line":
        return (
          <Line
            data={lineData}
            options={darkOptions()}
            style={{ height: "100%" }}
          />
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
            style={{ height: "100%" }}
          />
        );
      case "Radar":
        return (
          <Radar
            data={radarData}
            options={radarOptions}
            style={{ height: "100%" }}
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
            style={{ height: "100%" }}
          />
        );
      default:
        return null;
    }
  };

  const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
  const totalVol = coins.reduce((s, c) => s + (c.total_volume || 0), 0);
  const btc = coins.find((c) => c.id === "bitcoin");

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #060910; }
    .dash { background: #060910; min-height: 100vh; padding: 24px; font-family: 'Space Mono', monospace; color: #e6edf3; }

    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-dot { width: 10px; height: 10px; border-radius: 50%; background: #f7931a; box-shadow: 0 0 16px #f7931a; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
    .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; background: linear-gradient(90deg,#f7931a,#ffe066); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .sub { font-size: 11px; color: #4a5568; margin-top: 2px; }
    .meta { display: flex; align-items: center; gap: 16px; }
    .live-badge { display: flex; align-items: center; gap: 6px; background: #0d1117; border: 1px solid #21262d; border-radius: 20px; padding: 6px 14px; font-size: 11px; color: #56d364; }
    .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #56d364; animation: pulse 1.5s infinite; }
    .last-updated { font-size: 10px; color: #4a5568; }
    .refresh-btn { background: linear-gradient(135deg,#1a1f2e,#21262d); border: 1px solid #30363d; color: #a0aec0; padding: 7px 16px; border-radius: 8px; cursor: pointer; font-size: 11px; font-family: 'Space Mono',monospace; transition: all 0.2s; }
    .refresh-btn:hover { border-color: #f7931a; color: #f7931a; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 14px; margin-bottom: 28px; }
    .stat-card { background: #0d1117; border: 1px solid #21262d; border-radius: 12px; padding: 16px; transition: border-color 0.2s; }
    .stat-card:hover { border-color: #f7931a44; }
    .stat-label { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .stat-val { font-family: 'Syne',sans-serif; font-weight: 700; font-size: 18px; color: #e6edf3; }
    .stat-sub { font-size: 10px; color: #4a5568; margin-top: 2px; }

    .filter-bar { background: #0d1117; border: 1px solid #21262d; border-radius: 14px; margin-bottom: 20px; overflow: hidden; }
    .filter-toggle { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; cursor: pointer; user-select: none; }
    .filter-toggle:hover { background: #ffffff04; }
    .filter-title { display: flex; align-items: center; gap: 10px; font-family: 'Syne',sans-serif; font-weight: 700; font-size: 13px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1.5px; }
    .filter-badge { background: #f7931a; color: #000; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 10px; font-family: 'Space Mono',monospace; }
    .filter-toggle-right { display: flex; align-items: center; gap: 12px; }
    .reset-all-btn { background: none; border: 1px solid #30363d; color: #a0aec0; padding: 5px 12px; border-radius: 6px; font-size: 10px; cursor: pointer; font-family: 'Space Mono',monospace; transition: all 0.2s; }
    .reset-all-btn:hover { border-color: #f7931a; color: #f7931a; }
    .chevron { font-size: 12px; color: #4a5568; transition: transform 0.3s; }
    .chevron.open { transform: rotate(180deg); }
    .filters-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 16px; padding: 0 20px 20px; }

    .filter-card { background: #060910; border: 1px solid #21262d; border-radius: 10px; padding: 14px; transition: border-color 0.2s; }
    .filter-card.active { border-color: #f7931a55; background: #f7931a05; }
    .filter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .filter-label { font-size: 10px; color: #4a5568; text-transform: uppercase; letter-spacing: 1px; }
    .reset-btn { background: none; border: none; color: #f7931a; font-size: 9px; cursor: pointer; font-family: 'Space Mono',monospace; }
    .range-values { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .range-val { font-family: 'Syne',sans-serif; font-weight: 700; font-size: 13px; color: #e6edf3; }
    .range-sep { color: #4a5568; font-size: 11px; }
    .slider-wrap { position: relative; height: 24px; margin-bottom: 4px; }
    .slider-track { position: absolute; top: 50%; transform: translateY(-50%); left: 0; right: 0; height: 3px; background: #21262d; border-radius: 2px; }
    .slider-fill { position: absolute; height: 100%; background: linear-gradient(90deg,#f7931a,#ffe066); border-radius: 2px; }
    .range-input { position: absolute; width: 100%; height: 100%; top: 0; left: 0; opacity: 0; cursor: pointer; margin: 0; -webkit-appearance: none; appearance: none; background: transparent; pointer-events: all; }
    .range-input::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #f7931a; border: 2px solid #060910; cursor: pointer; box-shadow: 0 0 6px #f7931a88; }
    .range-extremes { display: flex; justify-content: space-between; font-size: 9px; color: #4a5568; }

    .section-title { font-family: 'Syne',sans-serif; font-weight: 700; font-size: 14px; color: #a0aec0; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 14px; }
    .results-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    .results-count { font-size: 11px; color: #4a5568; }
    .results-count span { color: #f7931a; font-weight: 700; }

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
    .no-results { text-align: center; padding: 40px; color: #4a5568; font-size: 12px; }

    .charts-panel { background: #0d1117; border: 1px solid #21262d; border-radius: 14px; overflow: hidden; }
    .tabs { display: flex; border-bottom: 1px solid #21262d; overflow-x: auto; }
    .tab-btn { background: none; border: none; color: #4a5568; font-family: 'Space Mono',monospace; font-size: 11px; padding: 14px 20px; cursor: pointer; white-space: nowrap; letter-spacing: 0.5px; transition: all 0.2s; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn:hover { color: #a0aec0; background: #ffffff05; }
    .tab-btn.active { color: #f7931a; border-bottom-color: #f7931a; background: #f7931a08; }
    .chart-area { padding: 24px; height: 400px; position: relative; }
    .chart-desc { font-size: 10px; color: #4a5568; margin-bottom: 16px; font-style: italic; }

    .loading { display: flex; align-items: center; justify-content: center; height: 200px; color: #4a5568; font-size: 13px; gap: 10px; }
    .spinner { width: 18px; height: 18px; border: 2px solid #21262d; border-top-color: #f7931a; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg { color: #f87171; text-align: center; padding: 40px; font-size: 12px; }
  `;

  return (
    <>
      <style>{css}</style>
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

        {/* Filter Panel */}
        <div className="filter-bar">
          <div
            className="filter-toggle"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <div className="filter-title">
              🎛 Range Filters
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount} active</span>
              )}
            </div>
            <div className="filter-toggle-right">
              {isFiltered && (
                <button
                  className="reset-all-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterRanges({ ...filterLimits });
                  }}
                >
                  Reset All
                </button>
              )}
              <span className={`chevron ${filtersOpen ? "open" : ""}`}>▼</span>
            </div>
          </div>
          {filtersOpen && Object.keys(filterLimits).length > 0 && (
            <div className="filters-grid">
              {FILTERS.map(({ key, label, prefix, suffix }) => {
                const lim = filterLimits[key],
                  rng = filterRanges[key];
                if (!lim || !rng) return null;
                return (
                  <RangeSlider
                    key={key}
                    label={label}
                    min={lim[0]}
                    max={lim[1]}
                    value={rng}
                    prefix={prefix}
                    suffix={suffix}
                    onChange={(val) =>
                      setFilterRanges((prev) => ({ ...prev, [key]: val }))
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Table */}
        {!loading && !error && (
          <div className="results-bar">
            <div className="section-title">Market Overview</div>
            <div className="results-count">
              Showing <span>{sorted.length}</span> of{" "}
              <span>{coins.length}</span> coins{isFiltered && " (filtered)"}
            </div>
          </div>
        )}
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
          ) : sorted.length === 0 ? (
            <div className="no-results">
              😶 No coins match your filter range.
              <br />
              <span style={{ fontSize: 10, color: "#30363d" }}>
                Try widening your range or click Reset All
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
