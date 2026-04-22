// import { Radar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   RadialLinearScale,
//   PointElement,
//   LineElement,
//   Filler,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   RadialLinearScale,
//   PointElement,
//   LineElement,
//   Filler,
//   Tooltip,
//   Legend,
// );

// export default function RadarChart({ coins }) {
//   // Normalize helper: 0 to 100 scale
//   const normalize = (arr) => {
//     const max = Math.max(...arr);
//     const min = Math.min(...arr);
//     return arr.map((v) => (max === min ? 50 : ((v - min) / (max - min)) * 100));
//   };

//   const prices = coins.map((c) => c.current_price);
//   const volumes = coins.map((c) => c.total_volume);
//   const marketCaps = coins.map((c) => c.market_cap);
//   const priceChanges = coins.map((c) =>
//     Math.abs(c.price_change_percentage_24h ?? 0),
//   );
//   const highValues = coins.map((c) => c.high_24h ?? 0);

//   const data = {
//     labels: coins.map((c) => c.name),
//     datasets: [
//       {
//         label: "Price (normalized)",
//         data: normalize(prices),
//         backgroundColor: "rgba(99, 217, 255, 0.15)",
//         borderColor: "rgba(99, 217, 255, 0.9)",
//         borderWidth: 2,
//         pointBackgroundColor: "rgba(99, 217, 255, 1)",
//         pointRadius: 4,
//         fill: true,
//       },
//       {
//         label: "Volume (normalized)",
//         data: normalize(volumes),
//         backgroundColor: "rgba(255, 99, 180, 0.15)",
//         borderColor: "rgba(255, 99, 180, 0.9)",
//         borderWidth: 2,
//         pointBackgroundColor: "rgba(255, 99, 180, 1)",
//         pointRadius: 4,
//         fill: true,
//       },
//       {
//         label: "Market Cap (normalized)",
//         data: normalize(marketCaps),
//         backgroundColor: "rgba(120, 255, 168, 0.15)",
//         borderColor: "rgba(120, 255, 168, 0.9)",
//         borderWidth: 2,
//         pointBackgroundColor: "rgba(120, 255, 168, 1)",
//         pointRadius: 4,
//         fill: true,
//       },
//       {
//         label: "24h Change % (abs)",
//         data: normalize(priceChanges),
//         backgroundColor: "rgba(255, 200, 80, 0.15)",
//         borderColor: "rgba(255, 200, 80, 0.9)",
//         borderWidth: 2,
//         pointBackgroundColor: "rgba(255, 200, 80, 1)",
//         pointRadius: 4,
//         fill: true,
//       },
//       {
//         label: "24h High (normalized)",
//         data: normalize(highValues),
//         backgroundColor: "rgba(180, 120, 255, 0.15)",
//         borderColor: "rgba(180, 120, 255, 0.9)",
//         borderWidth: 2,
//         pointBackgroundColor: "rgba(180, 120, 255, 1)",
//         pointRadius: 4,
//         fill: true,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top",
//         labels: {
//           color: "#e2e8f0",
//           font: { size: 12, family: "'Courier New', monospace" },
//           padding: 16,
//           usePointStyle: true,
//           pointStyleWidth: 10,
//         },
//       },
//       tooltip: {
//         backgroundColor: "rgba(10, 10, 30, 0.9)",
//         borderColor: "rgba(99, 217, 255, 0.4)",
//         borderWidth: 1,
//         titleColor: "#63d9ff",
//         bodyColor: "#e2e8f0",
//         callbacks: {
//           label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}`,
//         },
//       },
//     },
//     scales: {
//       r: {
//         min: 0,
//         max: 100,
//         ticks: {
//           stepSize: 20,
//           color: "rgba(200,220,255,0.4)",
//           backdropColor: "transparent",
//           font: { size: 10 },
//         },
//         grid: {
//           color: "rgba(99, 217, 255, 0.12)",
//         },
//         angleLines: {
//           color: "rgba(99, 217, 255, 0.15)",
//         },
//         pointLabels: {
//           color: "#cbd5e1",
//           font: { size: 11, family: "'Courier New', monospace" },
//         },
//       },
//     },
//   };

//   return (
//     <div
//       style={{
//         background:
//           "linear-gradient(135deg, #0a0a1e 0%, #0f172a 50%, #0a0a1e 100%)",
//         borderRadius: "16px",
//         padding: "28px",
//         border: "1px solid rgba(99, 217, 255, 0.2)",
//         boxShadow:
//           "0 0 40px rgba(99, 217, 255, 0.08), inset 0 0 60px rgba(0,0,0,0.4)",
//         maxWidth: "700px",
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
//           ◈ Radar Analysis
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
//           All metrics normalized 0–100 for comparison
//         </p>
//       </div>

//       {/* Chart */}
//       <Radar data={data} options={options} />

//       {/* Footer note */}
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
//         * Raw values vary greatly — normalization enables visual comparison
//       </p>
//     </div>
//   );
// }
