// import { Chart } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   BarElement,
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
// } from "chart.js";

// ChartJS.register(
//   BarElement,
//   LineElement,
//   CategoryScale,
//   LinearScale,
//   PointElement,
// );

// export default function MixedChart({ coins }) {
//   const data = {
//     labels: coins.map((c) => c.name),
//     datasets: [
//       {
//         type: "bar",
//         label: "Volume",
//         data: coins.map((c) => c.total_volume),
//       },
//       {
//         type: "line",
//         label: "Price",
//         data: coins.map((c) => c.current_price),
//         borderColor: "red",
//       },
//     ],
//   };

//   return <Chart type="bar" data={data} />;
// }
