'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { Download, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { db } from '@/lib/db';
import { Button, Card, Select, Badge } from '@/components/shared';
import { useUser } from '@/lib/context';
import { formatDate, getDateRange, getRiskColor } from '@/lib/utils';
import type { RecoveryEntry, SubstanceLog } from '@/types';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

export function AnalyticsTab() {
  const { user } = useUser();
  const [dateRange, setDateRange] = useState('30');
  
  const entries = useLiveQuery(
    () => user ? db.entries.where('userId').equals(user.id).toArray() : [],
    [user]
  );

  const logs = useLiveQuery(
    () => user ? db.logs.where('userId').equals(user.id).toArray() : [],
    [user]
  );

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    const { start, end } = getDateRange(parseInt(dateRange));
    return entries.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, dateRange]);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const { start, end } = getDateRange(parseInt(dateRange));
    return logs.filter(l => {
      const d = new Date(l.timestamp);
      return d >= start && d <= end;
    });
  }, [logs, dateRange]);

  const moodData = useMemo(() => {
    return filteredEntries.map(e => ({
      date: formatDate(e.date),
      mood: e.mood,
      craving: e.cravingLevel,
    }));
  }, [filteredEntries]);

  const triggerData = useMemo(() => {
    const triggers: Record<string, number> = {};
    filteredEntries.forEach(e => {
      e.triggers.forEach(t => {
        triggers[t] = (triggers[t] || 0) + 1;
      });
    });
    return Object.entries(triggers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredEntries]);

  const copingData = useMemo(() => {
    const strategies: Record<string, number> = {};
    filteredEntries.forEach(e => {
      e.copingStrategies.forEach(s => {
        strategies[s] = (strategies[s] || 0) + 1;
      });
    });
    return Object.entries(strategies)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredEntries]);

  const substanceData = useMemo(() => {
    const substances: Record<string, number> = {};
    filteredLogs.forEach(l => {
      substances[l.substance] = (substances[l.substance] || 0) + l.quantity;
    });
    return Object.entries(substances)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredLogs]);

  const insights = useMemo(() => {
    const result: string[] = [];
    
    if (filteredEntries.length > 0) {
      const avgMood = filteredEntries.reduce((sum, e) => sum + e.mood, 0) / filteredEntries.length;
      const avgCraving = filteredEntries.reduce((sum, e) => sum + e.cravingLevel, 0) / filteredEntries.length;
      
      if (avgMood >= 7) result.push('Your mood has been consistently positive this period.');
      if (avgCraving <= 3) result.push('Great job managing your cravings!');
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const cravingByDay: number[] = new Array(7).fill(0);
      const countByDay: number[] = new Array(7).fill(0);
      
      filteredEntries.forEach(e => {
        const day = new Date(e.date).getDay();
        cravingByDay[day] += e.cravingLevel;
        countByDay[day]++;
      });
      
      const maxDay = cravingByDay.indexOf(Math.max(...cravingByDay));
      if (countByDay[maxDay] > 0) {
        result.push(`Cravings tend to be highest on ${days[maxDay]}s.`);
      }
    }

    if (filteredLogs.length > 0) {
      result.push(`You've logged ${filteredLogs.length} substance use entries this period.`);
    }

    return result;
  }, [filteredEntries, filteredLogs]);

  const riskLevel = useMemo(() => {
    if (!filteredEntries.length) return 0;
    const avgCraving = filteredEntries.reduce((sum, e) => sum + e.cravingLevel, 0) / filteredEntries.length;
    const logCount = filteredLogs.length;
    return Math.min(10, Math.round(avgCraving + (logCount * 0.1)));
  }, [filteredEntries, filteredLogs]);

  const heatmapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!heatmapRef.current || !filteredEntries.length) return;

    const container = d3.select(heatmapRef.current);
    container.selectAll('*').remove();

    const width = heatmapRef.current.clientWidth;
    const cellSize = Math.min(30, (width - 60) / 15);
    const height = cellSize * 8 + 40;

    const svg = container
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const dataByDay: Record<string, number> = {};
    filteredEntries.forEach(e => {
      dataByDay[e.date.split('T')[0]] = e.cravingLevel;
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const colorScale = d3.scaleSequential(d3.interpolateRgb('#10b981', '#ef4444'))
      .domain([0, 10]);

    svg.selectAll('text')
      .data(days)
      .enter()
      .append('text')
      .attr('x', 0)
      .attr('y', (_, i) => i * cellSize + cellSize)
      .attr('fill', '#a1a1aa')
      .attr('font-size', '10px')
      .text(d => d);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(18, 18, 26, 0.9)')
      .style('border', '1px solid rgba(255, 255, 255, 0.1)')
      .style('padding', '8px')
      .style('border-radius', '8px')
      .style('color', '#fafafa')
      .style('font-size', '12px')
      .style('z-index', '1000');

    for (let week = 0; week < 15; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() - (14 - week) * 7 - (6 - day));
        const dateStr = date.toISOString().split('T')[0];
        const value = dataByDay[dateStr] || 0;

        svg.append('rect')
          .attr('x', 40 + week * cellSize)
          .attr('y', day * cellSize)
          .attr('width', cellSize - 2)
          .attr('height', cellSize - 2)
          .attr('rx', 4)
          .attr('fill', value > 0 ? colorScale(value) : 'rgba(255, 255, 255, 0.05)')
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            tooltip
              .style('visibility', 'visible')
              .text(`${dateStr}: Craving ${value || 'N/A'}`);
            d3.select(this).attr('stroke', '#6366f1').attr('stroke-width', 2);
          })
          .on('mousemove', function(event) {
            tooltip
              .style('top', (event.pageY - 10) + 'px')
              .style('left', (event.pageX + 10) + 'px');
          })
          .on('mouseout', function() {
            tooltip.style('visibility', 'hidden');
            d3.select(this).attr('stroke', 'none');
          });
      }
    }

    return () => {
      tooltip.remove();
    };
  }, [filteredEntries]);

  const dateRangeOptions = [
    { value: '7', label: '7 Days' },
    { value: '30', label: '30 Days' },
    { value: '90', label: '90 Days' },
    { value: '365', label: '1 Year' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <div className="flex items-center gap-4">
          <Select
            options={dateRangeOptions}
            value={dateRange}
            onChange={setDateRange}
          />
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-foreground-muted">Avg Mood</p>
              <p className="text-2xl font-bold">
                {filteredEntries.length > 0
                  ? (filteredEntries.reduce((s, e) => s + e.mood, 0) / filteredEntries.length).toFixed(1)
                  : '-'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-foreground-muted">Avg Cravings</p>
              <p className="text-2xl font-bold">
                {filteredEntries.length > 0
                  ? (filteredEntries.reduce((s, e) => s + e.cravingLevel, 0) / filteredEntries.length).toFixed(1)
                  : '-'}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${getRiskColor(riskLevel)}20` }}>
              <AlertTriangle className="w-6 h-6" style={{ color: getRiskColor(riskLevel) }} />
            </div>
            <div>
              <p className="text-sm text-foreground-muted">Risk Level</p>
              <p className="text-2xl font-bold" style={{ color: getRiskColor(riskLevel) }}>
                {riskLevel}/10
              </p>
            </div>
          </div>
        </Card>
      </div>

      {insights.length > 0 && (
        <Card>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-warning mt-0.5" />
            <div>
              <h3 className="font-medium mb-2">Insights</h3>
              <ul className="space-y-1">
                {insights.map((insight, i) => (
                  <li key={i} className="text-sm text-foreground-muted">• {insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-medium mb-4">Mood & Craving Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={12} domain={[0, 10]} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(18, 18, 26, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} dot={false} name="Mood" />
              <Line type="monotone" dataKey="craving" stroke="#f59e0b" strokeWidth={2} dot={false} name="Craving" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-medium mb-4">Trigger Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={triggerData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name }) => name}
              >
                {triggerData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(18, 18, 26, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-medium mb-4">Coping Strategies</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={copingData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} width={100} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(18, 18, 26, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-medium mb-4">Craving Heatmap (Last 15 Weeks)</h3>
          <div ref={heatmapRef} />
        </Card>
      </div>
    </div>
  );
}
