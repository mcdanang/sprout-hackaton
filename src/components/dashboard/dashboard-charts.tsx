"use client";

import React from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

interface PulsePoint {
	date: string;
	value: number | null;
}

interface ActivityPoint {
	date: string;
	signals: number;
	concerns: number;
}

export function PulseChart({ data, title }: { data: PulsePoint[]; title: string }) {
	// Clean data for Recharts (nulls can break lines depending on config)
	const chartData = data.map(d => ({
		...d,
		displayDate: format(parseISO(d.date), "MMM d"),
	}));

	return (
		<div className="w-full h-64">
			<h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">{title}</h3>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
					<defs>
						<linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#B09100" stopOpacity={0.1} />
							<stop offset="95%" stopColor="#B09100" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
					<XAxis
						dataKey="displayDate"
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10, fill: "#94a3b8" }}
						minTickGap={30}
					/>
					<YAxis
						hide
						domain={[0, 100]}
					/>
					<Tooltip
						contentStyle={{ 
							borderRadius: "16px", 
							border: "none", 
							boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
							fontSize: "12px",
							fontWeight: "bold"
						}}
					/>
					<Line
						type="monotone"
						dataKey="value"
						stroke="#B09100"
						strokeWidth={3}
						dot={false}
						activeDot={{ r: 6, strokeWidth: 0, fill: "#B09100" }}
						connectNulls
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}

export function ActivityChart({ data, title }: { data: ActivityPoint[]; title: string }) {
	const chartData = data.map(d => ({
		...d,
		displayDate: format(parseISO(d.date), "MMM d"),
	}));

	return (
		<div className="w-full h-64">
			<h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">{title}</h3>
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
					<defs>
						<linearGradient id="colorSignals" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
						</linearGradient>
						<linearGradient id="colorConcerns" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
					<XAxis
						dataKey="displayDate"
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10, fill: "#94a3b8" }}
						minTickGap={30}
					/>
					<YAxis hide />
					<Tooltip
						contentStyle={{ 
							borderRadius: "16px", 
							border: "none", 
							boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
							fontSize: "12px",
							fontWeight: "bold"
						}}
					/>
					<Area
						type="monotone"
						dataKey="signals"
						stroke="#3b82f6"
						fillOpacity={1}
						fill="url(#colorSignals)"
						strokeWidth={2}
					/>
					<Area
						type="monotone"
						dataKey="concerns"
						stroke="#ef4444"
						fillOpacity={1}
						fill="url(#colorConcerns)"
						strokeWidth={2}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}

export function SquadActivityChart({ data, title }: { data: { date: string, count: number }[]; title: string }) {
	const chartData = data.map(d => ({
		...d,
		displayDate: format(parseISO(d.date), "MMM d"),
	}));

	return (
		<div className="w-full h-64">
			<h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">{title}</h3>
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
					<defs>
						<linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#10b981" stopOpacity={0} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
					<XAxis
						dataKey="displayDate"
						axisLine={false}
						tickLine={false}
						tick={{ fontSize: 10, fill: "#94a3b8" }}
						minTickGap={30}
					/>
					<YAxis hide />
					<Tooltip
						contentStyle={{ 
							borderRadius: "16px", 
							border: "none", 
							boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
							fontSize: "12px",
							fontWeight: "bold"
						}}
					/>
					<Area
						type="monotone"
						dataKey="count"
						stroke="#10b981"
						fillOpacity={1}
						fill="url(#colorCount)"
						strokeWidth={2}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
