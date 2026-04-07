"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";

type Props = {
  data: number[];
  color: string;
  id: string;
};

export function SparklineMini({ data, color, id }: Props) {
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `spark-fill-${id}`;

  return (
    <div className="h-10 w-full min-w-[72px]">
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin", "dataMax"]} hide width={0} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
