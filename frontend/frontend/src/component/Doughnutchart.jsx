// import { Doughnut } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// ChartJS.register(ArcElement, Tooltip, Legend);

// export default function DoughnutChart({ coins }) {
//   const colors = coins.map(
//     (_, i) => `hsla(${(i / coins.length) * 360}, 90%, 65%, 0.85)`,
//   );

//   const data = {
//     labels: coins.map((c) => c.name),
//     datasets: [
//       {
//         label: "Market Cap",
//         data: coins.map((c) => c.market_cap),
//         backgroundColor: colors,
//         borderColor: "rgba(10,10,30,0.8)",
//         borderWidth: 3,
//         hoverOffset: 16,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     cutout: "65%", // ← Doughnut hole size
//     plugins: {
//       legend: {
//         position: "right",
//         labels: {
//           color: "#e2e8f0",
//           font: { size: 11, family: "'Courier New', monospace" },
//           usePointStyle: true,
//           pointStyleWidth: 10,
//           padding: 14,
//         },
//       },
//       tooltip: {
//         backgroundColor: "rgba(10,10,30,0.95)",
//         borderColor: "rgba(99,217,255,0.3)",
//         borderWidth: 1,
//         titleColor: "#63d9ff",
//         bodyColor: "#e2e8f0",
//         callbacks: {
//           label: (ctx) => {
//             const coin = coins[ctx.dataIndex];
//             const total = coins.reduce((sum, c) => sum + c.market_cap, 0);
//             const percent = ((coin.market_cap / total) * 100).toFixed(2);
//             const cap = (coin.market_cap / 1_000_000_000).toFixed(2);
//             return [` 🏦 Market Cap: $${cap}B`, ` 📊 Share: ${percent}%`];
//           },
//         },
//       },
//     },
//   };

//   // Total market cap for center text
//   const totalB = (
//     coins.reduce((sum, c) => sum + c.market_cap, 0) / 1_000_000_000_000
//   ).toFixed(2);

//   // Center text plugin
//   const centerTextPlugin = {
//     id: "centerText",
//     beforeDraw(chart) {
//       const { ctx, chartArea } = chart;
//       if (!chartArea) return;
//       const cx = (chartArea.left + chartArea.right) / 2;
//       const cy = (chartArea.top + chartArea.bottom) / 2;

//       ctx.save();

//       ctx.font = "bold 22px 'Courier New'";
//       ctx.fillStyle = "#63d9ff";
//       ctx.textAlign = "center";
//       ctx.textBaseline = "middle";
//       ctx.fillText(`$${totalB}T`, cx, cy - 10);

//       ctx.font = "11px 'Courier New'";
//       ctx.fillStyle = "rgba(200,220,255,0.45)";
//       ctx.fillText("Total Cap", cx, cy + 14);

//       ctx.restore();
//     },
//   };

//   return (
//     <div
//       style={{
//         background:
//           "linear-gradient(135deg, #0a0a1e 0%, #0f172a 50%, #0a0a1e 100%)",
//         borderRadius: "16px",
//         padding: "28px",
//         border: "1px solid rgba(99,217,255,0.2)",
//         boxShadow:
//           "0 0 40px rgba(99,217,255,0.08), inset 0 0 60px rgba(0,0,0,0.4)",
//         maxWidth: "750px",
//         margin: "0 auto",
//       }}
//     >
//       {/* Header */}
//       <div style={{ marginBottom: "20px", textAlign: "center" }}>
//         <h3
//           style={{
//             color: "#63d9ff",
//             fontFamily: "'Courier New', monospace",
//             fontSize: "18px",
//             letterSpacing: "3px",
//             textTransform: "uppercase",
//             margin: 0,
//             textShadow: "0 0 20px rgba(99,217,255,0.5)",
//           }}
//         >
//           ◈ Doughnut Analysis
//         </h3>
//         <p
//           style={{
//             color: "rgba(200,220,255,0.4)",
//             fontFamily: "'Courier New', monospace",
//             fontSize: "11px",
//             margin: "6px 0 0",
//             letterSpacing: "1px",
//           }}
//         >
//           Market Cap Distribution — top 10 coins
//         </p>
//       </div>

//       <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />

//       {/* Footer */}
//       <p
//         style={{
//           color: "rgba(200,220,255,0.3)",
//           fontFamily: "'Courier New', monospace",
//           fontSize: "10px",
//           textAlign: "center",
//           marginTop: "16px",
//           letterSpacing: "1px",
//         }}
//       >
//         * Hover over any slice to see market cap share
//       </p>
//     </div>
//   );
// }
