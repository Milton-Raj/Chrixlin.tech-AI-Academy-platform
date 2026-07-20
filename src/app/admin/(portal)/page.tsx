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
  batchFill: {
    id: string;
    batchName: string;
    startDate: string;
    registered: number;
    capacity: number;
    seatsLeft: number;
    status: string;
  }[];
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

      {/* Seats & registrations per batch */}
      <div className="card">
        <h2 className="text-sm font-semibold">Seats & Registrations by Batch</h2>
        <p className="mt-1 text-xs text-muted">
          Paid registrations per batch, straight from the database.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="th">Batch</th>
                <th className="th">Starts</th>
                <th className="th">Registered</th>
                <th className="th">Seats Left</th>
                <th className="th">Fill Rate</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.batchFill.length === 0 && (
                <tr>
                  <td className="td text-muted" colSpan={6}>
                    No batches yet.
                  </td>
                </tr>
              )}
              {stats.batchFill.map((b) => {
                const pct = Math.min(Math.round((b.registered / b.capacity) * 100), 100);
                return (
                  <tr key={b.id} className="hover:bg-white/[0.02]">
                    <td className="td font-medium">{b.batchName}</td>
                    <td className="td text-xs">{formatDate(b.startDate)}</td>
                    <td className="td">
                      <span className="font-bold text-white">{b.registered}</span>
                      <span className="text-muted"> / {b.capacity}</span>
                    </td>
                    <td className="td">
                      <span className={b.seatsLeft === 0 ? "font-semibold text-red-400" : ""}>
                        {b.seatsLeft}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? "bg-cta" : "bg-gradient-to-r from-electric to-gold"}`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">{pct}%</span>
                      </div>
                    </td>
                    <td className="td">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
