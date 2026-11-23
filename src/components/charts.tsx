"use client";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#347357", "#EAB308", "#568a73", "#234d3b", "#84bfa6", "#ca9a06", "#94a3b8"];

export function Charts({ byCategory, byStatus, claims }: {
  byCategory: { name: string; count: number }[];
  byStatus: { name: string; count: number }[];
  claims: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
        <p className="mb-2 text-sm font-bold">Inovasi per Kategori</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byCategory} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#347357" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-brand-100">
        <p className="mb-2 text-sm font-bold">Status Inovasi vs Klaim Adopsi</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={byStatus} dataKey="count" nameKey="name" outerRadius={80} label>
              {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <ul className="mt-2 space-y-1 text-sm">
          {claims.map((c) => <li key={c.name} className="flex justify-between border-b border-gray-100 py-1"><span>Klaim {c.name}</span><b>{c.count}</b></li>)}
        </ul>
      </div>
    </div>
  );
}
