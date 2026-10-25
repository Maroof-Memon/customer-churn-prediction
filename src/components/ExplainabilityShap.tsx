import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { SHAP_FEATURE_IMPORTANCE } from '../pipelineResults';
import { BrainCircuit, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

export const ExplainabilityShap: React.FC = () => {
  // Format data for Recharts horizontal bar chart
  const chartData = SHAP_FEATURE_IMPORTANCE.map((item) => ({
    name: item.feature,
    importance: Math.abs(item.importance),
    signedImportance: item.importance,
    direction: item.direction,
    description: item.description,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <span>Explainability (SHAP): Feature Importance Analysis</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Shapley Additive exPlanations (SHAP) computed via <code className="text-indigo-300 font-mono">shap.TreeExplainer</code> on the fitted XGBoost model. Values quantify each feature's marginal contribution to the model output.
        </p>
      </div>

      {/* SHAP Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Top 5 Features Driving Churn (Mean |SHAP Value|)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked magnitude of each feature's impact on predicting customer churn.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Increases Churn (+Risk)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Decreases Churn (Protective)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 140, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis 
                type="number" 
                domain={[0, 0.8]} 
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Mean |SHAP Value| (Impact on Model Log-Odds)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#64748b"
                tick={{ fill: '#e2e8f0', fontSize: 11 }}
                width={130}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '12px' }}
                formatter={(val: any, name: any, item: any) => [
                  `${Number(val).toFixed(3)} (${item.payload.direction === 'positive' ? '+Accelerates Churn' : '-Shields Retention'})`,
                  'Mean |SHAP|'
                ]}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.direction === 'positive' ? '#f43f5e' : '#10b981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Deep Dive Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SHAP_FEATURE_IMPORTANCE.map((item, idx) => {
          const isPos = item.direction === 'positive';
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">Rank #{idx + 1}</span>
                <span className={`text-xs font-mono font-semibold flex items-center gap-1 ${
                  isPos ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{isPos ? `+${item.importance.toFixed(3)}` : item.importance.toFixed(3)}</span>
                </span>
              </div>

              <h4 className="text-xs font-bold text-white font-mono">{item.feature}</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
