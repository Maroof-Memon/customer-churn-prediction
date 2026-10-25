import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Legend 
} from 'recharts';
import { 
  DATASET_SUMMARY, 
  CHURN_BY_CONTRACT, 
  MONTHLY_CHARGES_VS_CHURN, 
  SAMPLE_DATASET_ROWS 
} from '../pipelineResults';
import { Database, Filter, Layers, Users } from 'lucide-react';

export const EdaDataset: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <span>Exploratory Data Analysis & Dataset Overview</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Profiling of the Telco Customer Churn dataset (7,043 accounts). Analysis of class distributions, feature relationships, and customer attrition patterns.
        </p>
      </div>

      {/* Dataset Summary Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <span className="text-xs font-mono text-slate-400 block">Total Cohort</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {DATASET_SUMMARY.totalRows.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">21 Feature Columns</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <span className="text-xs font-mono text-slate-400 block">Churn Rate (Target)</span>
          <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums mt-1 block">
            {DATASET_SUMMARY.churnRate}%
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {DATASET_SUMMARY.churnCount.toLocaleString()} Churned / {DATASET_SUMMARY.retainedCount.toLocaleString()} Retained
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <span className="text-xs font-mono text-slate-400 block">Average Tenure</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {DATASET_SUMMARY.avgTenureMonths}{' '}
            <span className="text-sm font-normal text-slate-400">months</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Range: 1 - 72 months</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <span className="text-xs font-mono text-slate-400 block">Median Monthly Bill</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            ${DATASET_SUMMARY.medianMonthlyCharges.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Standard Dev: $30.09</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Churn Rate by Contract Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Churn Rate by Contract Type</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer defection percentage grouped by contractual commitment.
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHURN_BY_CONTRACT} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="contract" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  unit="%" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Churn Rate']}
                />
                <Bar dataKey="churnRate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Churn Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 flex items-center justify-between font-mono">
            <span>Month-to-month: 42.7%</span>
            <span>One year: 11.3%</span>
            <span>Two year: 2.8%</span>
          </div>
        </div>

        {/* Chart 2: Monthly Charges vs. Churn */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Charges vs. Churn Volume</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Distribution of retained vs churned customers across price tiers ($20 to $120).
            </p>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_CHARGES_VS_CHURN} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="range" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Area type="monotone" dataKey="retained" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.25} name="Retained" />
                <Area type="monotone" dataKey="churned" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} name="Churned" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 font-mono">
            Observation: Churn density peaks between $70-$100/mo (Fiber Optic subscribers).
          </div>
        </div>
      </div>

      {/* Dataset Sample Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Dataset Sample (First 10 Records)</h3>
          <span className="text-xs font-mono text-slate-400">10 of 7,043 rows</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-md">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800 font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-3.5 py-2.5">ID</th>
                <th className="px-3.5 py-2.5">Tenure</th>
                <th className="px-3.5 py-2.5">Contract</th>
                <th className="px-3.5 py-2.5">Internet</th>
                <th className="px-3.5 py-2.5">Tech Support</th>
                <th className="px-3.5 py-2.5">Payment Method</th>
                <th className="px-3.5 py-2.5 text-right">Monthly</th>
                <th className="px-3.5 py-2.5 text-right">Total</th>
                <th className="px-3.5 py-2.5 text-center">Churn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {SAMPLE_DATASET_ROWS.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3.5 py-2 text-indigo-400">{row.id}</td>
                  <td className="px-3.5 py-2">{row.tenure} mos</td>
                  <td className="px-3.5 py-2 font-sans">{row.contract}</td>
                  <td className="px-3.5 py-2 font-sans">{row.internetService}</td>
                  <td className="px-3.5 py-2 font-sans">{row.techSupport}</td>
                  <td className="px-3.5 py-2 font-sans text-slate-400">{row.paymentMethod}</td>
                  <td className="px-3.5 py-2 text-right">${row.monthlyCharges.toFixed(2)}</td>
                  <td className="px-3.5 py-2 text-right">${row.totalCharges.toFixed(2)}</td>
                  <td className="px-3.5 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                      row.churn === 'Yes' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {row.churn}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
