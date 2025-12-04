
import React, { useState } from 'react';
import { MissionSettings, DatasetStats } from '../types';

interface MissionConfigProps {
  stats: DatasetStats;
  onConfirm: (settings: MissionSettings) => void;
  onCancel: () => void;
}

export const MissionConfig: React.FC<MissionConfigProps> = ({ stats, onConfirm, onCancel }) => {
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [deepScan, setDeepScan] = useState(false);
  const [predictiveModeling, setPredictiveModeling] = useState(true);
  const [forcePersona, setForcePersona] = useState('');
  const [analysisGoal, setAnalysisGoal] = useState('');

  const handleLaunch = () => {
    onConfirm({
      enableGrounding,
      deepScan,
      predictiveModeling,
      forcePersona: forcePersona.trim(),
      analysisGoal: analysisGoal.trim()
    });
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center relative">
          <div>
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Mission Configuration</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">PRE-FLIGHT CHECK // DRS ENGINE</p>
          </div>
          <div className="h-8 w-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          {/* Decorative stripe */}
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-red-600 to-transparent"></div>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Packet Info */}
          <div className="flex items-center gap-4 bg-slate-950/50 p-3 border border-slate-800 rounded-sm">
             <div className="flex-1 text-center border-r border-slate-800">
               <p className="text-[10px] text-slate-500 font-mono uppercase">Packet Size</p>
               <p className="text-lg font-mono font-bold text-white">{stats.rowCount.toLocaleString()} <span className="text-xs font-normal text-slate-600">ROWS</span></p>
             </div>
             <div className="flex-1 text-center">
               <p className="text-[10px] text-slate-500 font-mono uppercase">Telemetry Channels</p>
               <p className="text-lg font-mono font-bold text-white">{stats.columnProfiles.length} <span className="text-xs font-normal text-slate-600">COLS</span></p>
             </div>
          </div>

          {/* Module 1: Grounding */}
          <div className="flex items-start justify-between group">
             <div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                   Google Grounding
                   <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">SEARCH</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">Allows Gemini to access real-time web data to identify context and trends.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" checked={enableGrounding} onChange={e => setEnableGrounding(e.target.checked)} className="sr-only peer" />
               <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none border border-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white peer-checked:border-blue-500"></div>
             </label>
          </div>

          {/* Module 2: Deep Scan */}
          <div className="flex items-start justify-between group">
             <div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                   Deep Scan Protocol
                   <span className="text-[10px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20">INTENSIVE</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">Enable exhaustive pattern matching. Increases processing time but yields higher fidelity insights.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" checked={deepScan} onChange={e => setDeepScan(e.target.checked)} className="sr-only peer" />
               <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none border border-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white peer-checked:border-purple-500"></div>
             </label>
          </div>

          {/* Module 3: Predictive Modeling */}
          <div className="flex items-start justify-between group">
             <div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                   Predictive Modeling
                   <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">MATH</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                   Enable Linear Regression and Monte Carlo simulations for risk and trend forecasting.
                </p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" checked={predictiveModeling} onChange={e => setPredictiveModeling(e.target.checked)} className="sr-only peer" />
               <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none border border-slate-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:border-emerald-500"></div>
             </label>
          </div>

           {/* Manual Override Section */}
           <div className="space-y-4">
              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-bold text-white uppercase mb-2">Manual Override</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Persona Override */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Target Persona</label>
                    <input 
                      type="text" 
                      value={forcePersona}
                      onChange={(e) => setForcePersona(e.target.value)}
                      placeholder="e.g. Chief Financial Officer..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-slate-700 font-mono"
                    />
                  </div>
                  {/* Goal Override */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Mission Objective</label>
                    <input 
                      type="text" 
                      value={analysisGoal}
                      onChange={(e) => setAnalysisGoal(e.target.value)}
                      placeholder="e.g. Find cost savings..."
                      className="w-full bg-slate-950 border border-slate-700 text-white text-sm px-3 py-2 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-slate-700 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Optional: Define specific roles or goals to tailor the DRS analysis.</p>
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
           <button onClick={onCancel} className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors">
             Abort Mission
           </button>
           <button 
             onClick={handleLaunch}
             className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all flex items-center gap-2 group"
           >
             Initialize System
             <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </button>
        </div>
      </div>
    </div>
  );
};