import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MiniChartProps {
  token: string;
  data: any[];
}

const MiniChart: React.FC<MiniChartProps> = ({ token, data }) => {
  const chartData = data.map((entry) => ({
    time: entry.time,
    value: entry[`${token}_raw`] ?? 0,
  }));

  return (
    <div style={{ height: 150 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="time" hide />
          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(val) => Number(val).toLocaleString()}
          />
          <Tooltip
            formatter={(value) =>
              typeof value === "number" ? value.toLocaleString() : value
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00c3ff"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MiniChart;
