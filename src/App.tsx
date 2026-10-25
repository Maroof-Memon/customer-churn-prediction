/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EdaDataset } from './components/EdaDataset';
import { Preprocessing } from './components/Preprocessing';
import { ModelBenchmark } from './components/ModelBenchmark';
import { ExplainabilityShap } from './components/ExplainabilityShap';
import { LiveInference } from './components/LiveInference';
import { 
  Database, 
  Workflow, 
  BarChart3, 
  BrainCircuit, 
  PlayCircle 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'eda' | 'preprocessing' | 'benchmark' | 'shap' | 'inference'>('eda');

  const tabs = [
    { id: 'eda', label: '1. EDA & Dataset', icon: Database },
    { id: 'preprocessing', label: '2. Preprocessing', icon: Workflow },
    { id: 'benchmark', label: '3. Model Benchmark', icon: BarChart3 },
    { id: 'shap', label: '4. Explainability (SHAP)', icon: BrainCircuit },
    { id: 'inference', label: '5. Live Inference', icon: PlayCircle },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs font-mono">
                ML
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Customer Churn Prediction
                </h1>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Machine-Learning Workflow & Classification Models
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-indigo-400 border border-slate-700 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
              Python · Pandas · Scikit-Learn · XGBoost
            </div>
          </div>
        </div>

        {/* Mobile Tab Scroll Bar */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800 bg-slate-950/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white bg-slate-900'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'eda' && <EdaDataset />}
        {activeTab === 'preprocessing' && <Preprocessing />}
        {activeTab === 'benchmark' && <ModelBenchmark />}
        {activeTab === 'shap' && <ExplainabilityShap />}
        {activeTab === 'inference' && <LiveInference />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
            <div>
              Customer Churn Prediction Application · Telco Dataset Analysis
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>scikit-learn 1.4+</span>
              <span>·</span>
              <span>xgboost</span>
              <span>·</span>
              <span>shap</span>
              <span>·</span>
              <span>recharts</span>
            </div>
          </div>
          <div className="text-center text-[11px] text-slate-500 italic border-t border-slate-800/60 pt-3">
            The live risk estimator uses a simplified scoring model for what-if analysis. The trained XGBoost pipeline and reported metrics are reproducible with <code className="font-mono text-slate-400">python run_pipeline.py</code>.
          </div>
        </div>
      </footer>
    </div>
  );
}
