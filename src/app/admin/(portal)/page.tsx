"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { IndianRupee, Users, GraduationCap, TrendingUp } from "lucide-react";
import { inr, formatDate } from "@/lib/format";

interface Stats {
  revenue: { total: number; today: number; month: number; year: number };
  registrations: { today: number; month: number; year: number };
  students: { active: number; completed: number };
  conversionRate: number;
  upcomingBatches: {
    id: string;
    batchName: string;
    startDate: string;
    seatsFilled: number;
    capacity: number;
  }[];
  batchFill: { batchName: string; seatsFilled: number; capacity: number; status: string }[];
  revenueByMonth: { label: string; revenue: number }[];
  registrationsByDay: { label: string; count: number }[];
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="card !p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{title}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#1E293B",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load stats"))))
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!stats) return <p className="text-sm text-muted">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted">Business overview at a glance</p>
      </div>

      {/* Revenue */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={inr(stats.revenue.total)}
          icon={IndianRupee}
          accent="bg-gold/15 text-gold"
        />
        <StatCard
          title="Today"
          value={inr(stats.revenue.today)}
          icon={IndianRupee}
          accent="bg-electric/15 text-electric"
        />
        <StatCard
          title="This Month"
          value={inr(stats.revenue.month)}
          icon={IndianRupee}
          accent="bg-electric/15 text-electric"
        />
        <StatCard
          title="This Year"
          value={inr(stats.revenue.year)}
          icon={IndianRupee}
          accent="bg-electric/15 text-electric"
        />
      </div>

      {/* Registrations & students */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Registrations"
          value={String(stats.registrations.month)}
          sub={`Today: ${stats.registrations.today} • Year: ${stats.registrations.year}`}
          icon={Users}
          accent="bg-cta/15 text-cta"
        />
        <StatCard
          title="Active Students"
          value={String(stats.students.active)}
          icon={Users}
          accent="bg-green-500/15 text-green-400"
        />
        <StatCard
          title="Completed Students"
          value={String(stats.students.completed)}
          icon={GraduationCap}
          accent="bg-gold/15 text-gold"
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate}%`}
          sub="Paid / total registrations"
          icon={TrendingUp}
          accent="bg-electric/15 text-electric"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card">
          <h2 className="text-sm font-semibold">Revenue — last 6 months</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueByMonth}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => inr(Number(v))} />
                <Area type="monotone" dataKey="revenue" stroke="#F59E0B" fill="url(#rev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold">Registrations — last 14 days</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.registrationsByDay}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Batch fill + upcoming */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card">
          <h2 className="text-sm font-semibold">Batch Fill Rate</h2>
          <div className="mt-4 space-y-3">
            {stats.batchFill.length === 0 && <p className="text-sm text-muted">No active batches.</p>}
            {stats.batchFill.map((b) => {
              const pct = Math.min(Math.round((b.seatsFilled / b.capacity) * 100), 100);
              return (
                <div key={b.batchName}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">
                      {b.batchName}
                      <span className="ml-2 text-muted">({b.status})</span>
                    </span>
                    <span className="text-muted">
                      {b.seatsFilled}/{b.capacity} • {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${pct >= 90 ? "bg-cta" : "bg-gradient-to-r from-electric to-gold"}`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold">Upcoming Batches</h2>
          <table className="mt-3 w-full">
            <thead>
              <tr>
                <th className="th">Batch</th>
                <th className="th">Starts</th>
                <th className="th">Seats</th>
              </tr>
            </thead>
            <tbody>
              {stats.upcomingBatches.map((b) => (
                <tr key={b.id}>
                  <td className="td font-medium">{b.batchName}</td>
                  <td className="td">{formatDate(b.startDate)}</td>
                  <td className="td">
                    {b.seatsFilled}/{b.capacity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
