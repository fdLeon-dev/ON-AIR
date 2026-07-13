"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel } from "@/components/dashboard/dashboard-ui";

type RevenuePoint = {
  label: string;
  revenue: number;
  orders: number;
};

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <Panel
      title="Ingresos recientes"
      description="Evolución de pedidos y ventas del período."
      className="h-full"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.5)" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.2)" }}
              contentStyle={{
                background: "rgba(10, 15, 28, 0.95)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16,
                color: "white",
              }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="orders" stroke="#60a5fa" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
