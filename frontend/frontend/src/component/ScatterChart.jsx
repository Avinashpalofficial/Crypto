import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

export default function ScatterChart({ coins }) {
  const data = {
    datasets: coins.map((coin, i) => {
      const hue = (i / coins.length) * 360;
      return {
        label: coin.name,
        data: [
          {
            x: coin.total_volume, // X-axis → Volume
            y: coin.current_price, // Y-axis → Price
          },
        ],
        backgroundColor: `hsla(${hue}, 90%, 65%, 0.85)`,
        pointRadius: 10,
        pointHoverRadius: 14,
      };
    }),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#e2e8f0",
          font: { size: 11, family: "'Courier New', monospace" },
          usePointStyle: true,
          pointStyleWidth: 10,
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: "rgba(10,10,30,0.95)",
        borderColor: "rgba(99,217,255,0.3)",
        borderWidth: 1,
        titleColor: "#63d9ff",
        bodyColor: "#e2e8f0",
        callbacks: {
          label: (ctx) => {
            const coin = coins[ctx.datasetIndex];
            return [
              ` 💰 Price:  $${coin.current_price.toLocaleString()}`,
              ` 📊 Volume: $${coin.total_volume.toLocaleString()}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Total Volume (24h) →",
          color: "rgba(99,217,255,0.7)",
          font: { size: 12, family: "'Courier New', monospace" },
        },
        ticks: {
          color: "rgba(200,220,255,0.5)",
          font: { size: 10 },
          callback: (v) => {
            if (v >= 1_000_000_000)
              return `$${(v / 1_000_000_000).toFixed(0)}B`;
            if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
            return `$${v}`;
          },
        },
        grid: { color: "rgba(99,217,255,0.07)" },
      },
      y: {
        title: {
          display: true,
          text: "Current Price (USD) →",
          color: "rgba(255,99,180,0.7)",
          font: { size: 12, family: "'Courier New', monospace" },
        },
        ticks: {
          color: "rgba(200,220,255,0.5)",
          font: { size: 10 },
          callback: (v) => {
            if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
            return `$${v}`;
          },
        },
        grid: { color: "rgba(255,99,180,0.07)" },
      },
    },
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #0a0a1e 0%, #0f172a 50%, #0a0a1e 100%)",
        borderRadius: "16px",
        padding: "28px",
        border: "1px solid rgba(99,217,255,0.2)",
        boxShadow:
          "0 0 40px rgba(99,217,255,0.08), inset 0 0 60px rgba(0,0,0,0.4)",
        maxWidth: "750px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px", textAlign: "center" }}>
        <h3
          style={{
            color: "#63d9ff",
            fontFamily: "'Courier New', monospace",
            fontSize: "18px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            margin: 0,
            textShadow: "0 0 20px rgba(99,217,255,0.5)",
          }}
        >
          ◈ Scatter Analysis
        </h3>
        <p
          style={{
            color: "rgba(200,220,255,0.4)",
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            margin: "6px 0 0",
            letterSpacing: "1px",
          }}
        >
          Price vs Volume — each dot = 1 coin
        </p>
      </div>

      <Scatter data={data} options={options} />

      {/* Footer */}
      <p
        style={{
          color: "rgba(200,220,255,0.3)",
          fontFamily: "'Courier New', monospace",
          fontSize: "10px",
          textAlign: "center",
          marginTop: "16px",
          letterSpacing: "1px",
        }}
      ></p>
    </div>
  );
}
