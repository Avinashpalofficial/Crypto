// import { Bubble } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   LinearScale,
//   PointElement,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

// export default function BubbleChart({ coins }) {
//   const data = {
//     datasets: [
//       {
//         label: "Crypto Bubble",
//         data: coins.map((c) => ({
//           x: c.market_cap / 1e9,
//           y: c.total_volume / 1e9,
//           r: Math.sqrt(c.market_cap) / 5000,
//         })),
//         backgroundColor: "rgba(255,99,132,0.6)",
//       },
//     ],
//   };

//   return <Bubble data={data} />;
// }
