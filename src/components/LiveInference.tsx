import React, { useState } from 'react';
import { predictCustomerChurn, InferenceInput } from '../inference';
import { PlayCircle, AlertTriangle, CheckCircle2, AlertOctagon, Sparkles, RotateCcw } from 'lucide-react';

export const LiveInference: React.FC = () => {
  const [tenure, setTenure] = useState<number>(4);
  const [monthlyCharges, setMonthlyCharges] = useState<number>(85.0);
  const [contract, setContract] = useState<'Month-to-month' | 'One year' | 'Two year'>('Month-to-month');
  const [internetService, setInternetService] = useState<'DSL' | 'Fiber optic' | 'No'>('Fiber optic');
  const [techSupport, setTechSupport] = useState<'Yes' | 'No'>('No');

  const [hasPredicted, setHasPredicted] = useState<boolean>(true);
  const [predictionResult, setPredictionResult] = useState(() => 
    predictCustomerChurn({ tenure: 4, monthlyCharges: 85.0, contract: 'Month-to-month', internetService: 'Fiber optic', techSupport: 'No' })
  );

  const handlePredict = () => {
    const res = predictCustomerChurn({
      tenure,
      monthlyCharges,
      contract,
      internetService,
      techSupport,
    });
    setPredictionResult(res);
    setHasPredicted(true);
  };

  const handleLoadPreset = (preset: 'high-risk' | 'loyal' | 'moderate') => {
    if (preset === 'high-risk') {
      setTenure(3);
      setMonthlyCharges(95.5);
      setContract('Month-to-month');
      setInternetService('Fiber optic');
      setTechSupport('No');
    } else if (preset === 'loyal') {
      setTenure(60);
      setMonthlyCharges(45.0);
      setContract('Two year');
      setInternetService('DSL');
      setTechSupport('Yes');
    } else {
      setTenure(24);
      setMonthlyCharges(65.0);
      setContract('One year');
      setInternetService('DSL');
      setTechSupport('Yes');
    }
  };

  const probPercent = (predictionResult.probability * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-indigo-400" />
          <span>Live Customer Churn Inference Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Input customer parameters to evaluate defection probability in real-time. Employs calibrated model decision weights.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Customer Profile Attributes</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Presets:</span>
              <button
                onClick={() => handleLoadPreset('high-risk')}
                className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] hover:bg-rose-900 transition-colors"
              >
                High Risk
              </button>
              <button
                onClick={() => handleLoadPreset('loyal')}
                className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] hover:bg-emerald-900 transition-colors"
              >
                Loyal Account
              </button>
              <button
                onClick={() => handleLoadPreset('moderate')}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] hover:bg-slate-700 transition-colors"
              >
                Moderate
              </button>
            </div>
          </div>

          {/* Tenure Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="tenure-input" className="font-medium text-slate-300">Tenure (Months with Service)</label>
              <span className="font-mono text-indigo-400 font-bold tabular-nums">
                {tenure} {tenure === 1 ? 'month' : 'months'}
              </span>
            </div>
            <input
              id="tenure-input"
              type="range"
              min={1}
              max={72}
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 Month (New)</span>
              <span>36 Months</span>
              <span>72 Months (Veteran)</span>
            </div>
          </div>

          {/* Monthly Charges Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="monthly-charges-input" className="font-medium text-slate-300">Monthly Recurring Charges ($)</label>
              <span className="font-mono text-indigo-400 font-bold tabular-nums">
                ${monthlyCharges.toFixed(2)} / mo
              </span>
            </div>
            <input
              id="monthly-charges-input"
              type="range"
              min={18}
              max={120}
              step={0.5}
              value={monthlyCharges}
              onChange={(e) => setMonthlyCharges(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>$18.00 (Basic)</span>
              <span>$70.00 (Average)</span>
              <span>$120.00 (Premium)</span>
            </div>
          </div>

          {/* Contract Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">Contract Agreement Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Month-to-month', 'One year', 'Two year'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContract(c)}
                  className={`px-3 py-2 text-xs font-medium rounded border text-center transition-colors ${
                    contract === c
                      ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Features for realism */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 block">Internet Service</label>
              <select
                value={internetService}
                onChange={(e) => setInternetService(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Fiber optic">Fiber optic</option>
                <option value="DSL">DSL</option>
                <option value="No">No Internet (Phone only)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-400 block">Tech Support Addon</label>
              <select
                value={techSupport}
                onChange={(e) => setTechSupport(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="No">No Support</option>
                <option value="Yes">Active Support</option>
              </select>
            </div>
          </div>

          {/* Predict Button */}
          <div className="pt-2">
            <button
              onClick={handlePredict}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow transition-colors flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Predict Churn Probability</span>
            </button>
          </div>
        </div>

        {/* Right: Prediction Output & Risk Gauge */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Model Prediction Result
              </span>
              <span className="text-xs font-mono text-emerald-400">Status: Inferred</span>
            </div>

            {/* Probability Metric */}
            <div className="text-center py-4">
              <div
                className={`text-6xl font-bold font-mono tabular-nums tracking-tight ${
                  predictionResult.probability >= 0.70
                    ? 'text-rose-500'
                    : predictionResult.probability >= 0.45
                    ? 'text-rose-400'
                    : predictionResult.probability >= 0.25
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {probPercent}%
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-2">
                {predictionResult.riskLevel === 'Critical' && <AlertOctagon className="w-4 h-4 text-rose-500" />}
                {predictionResult.riskLevel === 'High' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {predictionResult.riskLevel === 'Moderate' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {predictionResult.riskLevel === 'Low' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                <span className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {predictionResult.riskLevel} Risk Level
                </span>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>0% Low</span>
                <span>25% Moderate</span>
                <span>45% High</span>
                <span>100% Critical</span>
              </div>

              {/* Progress bar with marker */}
              <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div className="h-full bg-emerald-500/80" style={{ width: '25%' }} />
                <div className="h-full bg-amber-500/80" style={{ width: '20%' }} />
                <div className="h-full bg-rose-500/80" style={{ width: '25%' }} />
                <div className="h-full bg-rose-700/80" style={{ width: '30%' }} />
              </div>

              {/* Position indicator */}
              <div className="relative w-full h-3">
                <div 
                  className="absolute top-0 -translate-x-1/2 w-2 h-2 border-l-4 border-r-4 border-b-4 border-transparent border-b-white"
                  style={{ left: `${Math.min(98, Math.max(2, predictionResult.probability * 100))}%` }}
                />
              </div>
            </div>

            {/* Feature Attribution List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">Identified Risk Factors</span>
              <div className="space-y-1.5">
                {predictionResult.factors.map((f, i) => (
                  <div
                    key={i}
                    className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 font-medium">{f.name}</span>
                    <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                      f.isPositive 
                        ? 'text-rose-400 bg-rose-950/40 border border-rose-900/50' 
                        : 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50'
                    }`}>
                      {f.impact}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-400 font-mono">
            {predictionResult.probability >= 0.45
              ? 'Recommendation: Proactively offer annual contract incentive or complimentary tech support.'
              : 'Recommendation: Account retention risk is low; no intervention needed.'}
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg text-center">
        <p className="text-xs text-slate-500 italic">
          The live risk estimator uses a simplified scoring model for interactive what-if analysis. The trained XGBoost pipeline and reported metrics are reproducible with <code className="font-mono text-slate-400">python run_pipeline.py</code>.
        </p>
      </div>
    </div>
  );
};
