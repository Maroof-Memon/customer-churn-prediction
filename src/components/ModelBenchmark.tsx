import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { 
  MODEL_BENCHMARK_RESULTS, 
  ROC_CURVE_DATA, 
  CONFUSION_MATRICES,
  ModelMetric
} from '../pipelineResults';
import { BarChart3, Trophy } from 'lucide-react';

const champion = MODEL_BENCHMARK_RESULTS.reduce((best, model) =>
  model.rocAuc > best.rocAuc ? model : best
);

const rocSeries = [
  { key: 'xgboost', model: 'XGBoost', color: '#6366f1', width: 2.5 },
  { key: 'randomForest', model: 'Random Forest', color: '#10b981', width: 2 },
  { key: 'logisticRegression', model: 'Logistic Regression', color: '#38bdf8', width: 1.5 },
  { key: 'decisionTree', model: 'Decision Tree', color: '#f59e0b', width: 1.5 },
] as const;

export const ModelBenchmark: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>(champion.name);

  const currentCm = CONFUSION_MATRICES[selectedModel] || CONFUSION_MATRICES[champion.name];
  const total = currentCm.tp + currentCm.fp + currentCm.fn + currentCm.tn;

  const cmChartData = [
    { label: 'True Negative (TN)', count: currentCm.tn, type: 'Correct: Retained' },
    { label: 'True Positive (TP)', count: currentCm.tp, type: 'Correct: Churned' },
    { label: 'False Negative (FN)', count: currentCm.fn, type: 'Error: Missed Churn' },
    { label: 'False Positive (FP)', count: currentCm.fp, type: 'Error: False Alarm' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <span>Classification Models Benchmark & Diagnostic Evaluation</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Comparison of {MODEL_BENCHMARK_RESULTS.length} classification algorithms ({MODEL_BENCHMARK_RESULTS.map((model) => model.name).join(', ')}) evaluated on the held-out test split (20% partition, 1,409 instances).
        </p>
      </div>

      {/* Model Benchmark Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Model Performance Summary</h3>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Champion: {champion.name} ({champion.rocAuc.toFixed(3)} ROC-AUC)</span>
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-md">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800 font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3 font-sans">Model</th>
                <th className="px-4 py-3 font-sans">Algorithm Specifications</th>
                <th className="px-4 py-3 text-right">Accuracy</th>
                <th className="px-4 py-3 text-right">Precision</th>
                <th className="px-4 py-3 text-right">Recall</th>
                <th className="px-4 py-3 text-right">F1-Score</th>
                <th className="px-4 py-3 text-right">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {MODEL_BENCHMARK_RESULTS.map((model) => {
                const isSelected = selectedModel === model.name;
                const isChampion = model.name === champion.name;
                return (
                  <tr 
                    key={model.name}
                    onClick={() => setSelectedModel(model.name)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-950/40 text-white' : 'hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <td className="px-4 py-3 font-sans font-semibold text-white flex items-center gap-2">
                      {isChampion && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className={isSelected ? 'text-indigo-400' : ''}>{model.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-400">
                      <div>{model.algorithm}</div>
                      {model.cvAuc !== undefined && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          5-fold CV AUC: {model.cvAuc.toFixed(3)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                      {(model.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                      {(model.precision * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-400 font-semibold">
                      {(model.recall * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                      {model.f1.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-indigo-400 font-bold">
                      {model.rocAuc.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostics Grid: ROC Curve & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: ROC Curve (Recharts) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Receiver Operating Characteristic (ROC Curve)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              True Positive Rate vs. False Positive Rate across all probability thresholds.
            </p>
          </div>

          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ROC_CURVE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="fpr" 
                  type="number" 
                  domain={[0, 1]} 
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'True Positive Rate (Recall)', angle: -90, position: 'insideLeft', offset: 25, fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', fontSize: '11px' }}
                  formatter={(val: any) => [Number(val).toFixed(3), '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {rocSeries.map((series) => {
                  const model = MODEL_BENCHMARK_RESULTS.find(
                    (item) => item.name === series.model
                  );
                  return (
                    <Line
                      key={series.key}
                      type="monotone"
                      dataKey={series.key}
                      name={`${series.model} (AUC = ${model ? model.rocAuc.toFixed(3) : 'n/a'})`}
                      stroke={series.color}
                      strokeWidth={series.width}
                      dot={false}
                    />
                  );
                })}
                <Line 
                  type="monotone" 
                  dataKey="baseline" 
                  name="Random Baseline (0.50)" 
                  stroke="#475569" 
                  strokeDasharray="4 4" 
                  strokeWidth={1} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/80 font-mono">
            {champion.name} leads the comparison with a held-out ROC-AUC of {champion.rocAuc.toFixed(3)}.
          </div>
        </div>

        {/* Right: Confusion Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Confusion Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Classification outcomes on the test set at decision threshold <code className="text-indigo-400 font-mono">t = 0.50</code>.
              </p>
            </div>

            {/* Model toggle pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              {MODEL_BENCHMARK_RESULTS.map((model) => model.name).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    selectedModel === m ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 2x2 Matrix Grid */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            {/* True Negative */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-sans">True Negative (TN)</div>
              <div className="text-2xl font-bold text-slate-200 tabular-nums">
                {currentCm.tn.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {((currentCm.tn / total) * 100).toFixed(1)}% - Correctly predicted Retained
              </div>
            </div>

            {/* False Positive */}
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg space-y-1">
              <div className="text-[10px] text-amber-500 uppercase font-sans">False Positive (FP)</div>
              <div className="text-2xl font-bold text-amber-400 tabular-nums">
                {currentCm.fp.toLocaleString()}
              </div>
              <div className="text-[11px] text-amber-300/70 font-sans">
                {((currentCm.fp / total) * 100).toFixed(1)}% - False alarm (stayed)
              </div>
            </div>

            {/* False Negative */}
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg space-y-1">
              <div className="text-[10px] text-rose-500 uppercase font-sans">False Negative (FN)</div>
              <div className="text-2xl font-bold text-rose-400 tabular-nums">
                {currentCm.fn.toLocaleString()}
              </div>
              <div className="text-[11px] text-rose-300/70 font-sans">
                {((currentCm.fn / total) * 100).toFixed(1)}% - Missed churner
              </div>
            </div>

            {/* True Positive */}
            <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-1">
              <div className="text-[10px] text-emerald-500 uppercase font-sans">True Positive (TP)</div>
              <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                {currentCm.tp.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-300/70 font-sans">
                {((currentCm.tp / total) * 100).toFixed(1)}% - Correctly identified Churn
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">Test Precision</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {((currentCm.tp / (currentCm.tp + currentCm.fp)) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">Test Recall</span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                {((currentCm.tp / (currentCm.tp + currentCm.fn)) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">Total Evaluated</span>
              <span className="text-sm font-bold text-indigo-400 tabular-nums">
                {total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
