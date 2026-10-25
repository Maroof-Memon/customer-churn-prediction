import React, { useState } from 'react';
import { PREPROCESSING_SPECS } from '../pipelineResults';
import { Workflow, Code, Check, Copy, ArrowRight, Layers, Cpu, Split } from 'lucide-react';

export const Preprocessing: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PREPROCESSING_SPECS.pipelinePythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Workflow className="w-5 h-5 text-indigo-400" />
          <span>Scikit-Learn Preprocessing & ColumnTransformer Pipeline</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Visual architecture of the non-leaking feature transformation pipeline. Numerical features are normalized via <code className="text-indigo-300 font-mono">StandardScaler</code> and categoricals are encoded via <code className="text-indigo-300 font-mono">OneHotEncoder</code>.
        </p>
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
          ColumnTransformer Execution Topology
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Branch 1: Numerical Transformer */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 font-mono">BRANCH A: NUMERIC</span>
              <span className="text-[10px] font-mono text-slate-500">3 Features</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                <span className="text-slate-500 block text-[10px]">Inputs:</span>
                <code className="text-indigo-300 font-mono text-[11px]">['tenure', 'MonthlyCharges', 'TotalCharges']</code>
              </div>

              <div className="flex justify-center text-slate-600">↓</div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Step 1: Imputation</span>
                <span className="text-xs text-slate-200 font-mono">SimpleImputer(strategy='median')</span>
              </div>

              <div className="flex justify-center text-slate-600">↓</div>

              <div className="p-2 bg-indigo-950/30 rounded border border-indigo-900/50">
                <span className="text-[10px] text-indigo-400 block font-semibold">Step 2: Standardization</span>
                <span className="text-xs text-white font-mono">StandardScaler()</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Transforms continuous values to z-scores (<code className="text-indigo-300 font-mono">μ=0, σ=1</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Branch 2: Categorical Transformer */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 font-mono">BRANCH B: CATEGORICAL</span>
              <span className="text-[10px] font-mono text-slate-500">16 Features</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                <span className="text-slate-500 block text-[10px]">Inputs:</span>
                <code className="text-emerald-300 font-mono text-[11px]">['Contract', 'InternetService', 'PaymentMethod', ...]</code>
              </div>

              <div className="flex justify-center text-slate-600">↓</div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Step 1: Imputation</span>
                <span className="text-xs text-slate-200 font-mono">SimpleImputer(strategy='most_frequent')</span>
              </div>

              <div className="flex justify-center text-slate-600">↓</div>

              <div className="p-2 bg-emerald-950/30 rounded border border-emerald-900/50">
                <span className="text-[10px] text-emerald-400 block font-semibold">Step 2: Encoding</span>
                <span className="text-xs text-white font-mono">OneHotEncoder(drop='first')</span>
                <p className="text-[10px] text-slate-400 mt-1">
                  Prevents collinearity (dummy variable trap) by dropping reference category.
                </p>
              </div>
            </div>
          </div>

          {/* Branch 3: Combined ColumnTransformer -> Estimator */}
          <div className="bg-slate-950 border border-indigo-900/40 rounded-lg p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono">MERGED OUTPUT</span>
                <span className="text-[10px] font-mono text-indigo-400">31 Columns</span>
              </div>

              <div className="p-3 bg-slate-900 rounded border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-white block">ColumnTransformer Assembly</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Concatenates scaled numerical vectors and sparse one-hot dummy matrices in memory.
                </p>
              </div>

              <div className="p-3 bg-indigo-950/20 rounded border border-indigo-900/40 space-y-1">
                <span className="text-xs font-semibold text-indigo-300 block">End-to-End Pipeline</span>
                <p className="text-[11px] text-slate-400">
                  Ensures all transformations are fitted solely on training splits, eliminating data leakage.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span>Final Input Vector:</span>
              <span className="text-emerald-400 font-bold">X (7,043 × 31)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Transformation Matrix: Before vs After */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Feature Transformation Examples</h3>
        
        <div className="overflow-x-auto border border-slate-800 rounded-md">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800 font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Feature Name</th>
                <th className="px-4 py-2.5">Raw Data Type</th>
                <th className="px-4 py-2.5">Applied Transformer</th>
                <th className="px-4 py-2.5">Raw Sample Value</th>
                <th className="px-4 py-2.5">Transformed Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              <tr>
                <td className="px-4 py-2.5 text-indigo-400 font-semibold">tenure</td>
                <td className="px-4 py-2.5 text-slate-400">Continuous int</td>
                <td className="px-4 py-2.5 text-slate-200">StandardScaler()</td>
                <td className="px-4 py-2.5">2 months</td>
                <td className="px-4 py-2.5 text-emerald-400 font-bold">-1.241 (z-score)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-indigo-400 font-semibold">MonthlyCharges</td>
                <td className="px-4 py-2.5 text-slate-400">Continuous float</td>
                <td className="px-4 py-2.5 text-slate-200">StandardScaler()</td>
                <td className="px-4 py-2.5">$99.65</td>
                <td className="px-4 py-2.5 text-emerald-400 font-bold">+1.159 (z-score)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-emerald-400 font-semibold">Contract</td>
                <td className="px-4 py-2.5 text-slate-400">Categorical string (3 levels)</td>
                <td className="px-4 py-2.5 text-slate-200">OneHotEncoder(drop='first')</td>
                <td className="px-4 py-2.5">'Month-to-month'</td>
                <td className="px-4 py-2.5 text-emerald-400 font-bold">[0, 0] (Reference dropped)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-emerald-400 font-semibold">Contract</td>
                <td className="px-4 py-2.5 text-slate-400">Categorical string (3 levels)</td>
                <td className="px-4 py-2.5 text-slate-200">OneHotEncoder(drop='first')</td>
                <td className="px-4 py-2.5">'Two year'</td>
                <td className="px-4 py-2.5 text-emerald-400 font-bold">[0, 1]</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-emerald-400 font-semibold">InternetService</td>
                <td className="px-4 py-2.5 text-slate-400">Categorical string (3 levels)</td>
                <td className="px-4 py-2.5 text-slate-200">OneHotEncoder(drop='first')</td>
                <td className="px-4 py-2.5">'Fiber optic'</td>
                <td className="px-4 py-2.5 text-emerald-400 font-bold">[1, 0]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Python Code Snippet */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Scikit-Learn Implementation Code</h3>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Python'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
          {PREPROCESSING_SPECS.pipelinePythonCode}
        </pre>
      </div>
    </div>
  );
};
