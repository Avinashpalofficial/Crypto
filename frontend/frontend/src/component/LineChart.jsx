import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function LineChart({ coins }) {
  const data = {
    labels: coins.map((c) => c.name),
    datasets: [
      {
        label: "Price",
        data: coins.map((c) => c.current_price),
        borderColor: "green",
      },
    ],
  };

  return <Line data={data} />;
}
