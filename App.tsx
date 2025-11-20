import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { parseCSV, profileDataset } from './utils/dataUtils';
import { analyzeDatasetWithGemini } from './services/geminiService';
import { AppState, DataRow, DatasetStats, AIAnalysisResult } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [data, setData] = useState<DataRow[]>([]);
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  
  // System Status Logs
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setProcessingLogs(prev => [...prev, message]);
  };

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [processingLogs]);

  const handleFileUpload = async (csvContent: string) => {
    setAppState(AppState.PROCESSING);
    setProcessingLogs([]);

    // Step 1: Ingestion
    addLog("> INITIALIZING DRS TELEMETRY...");
    await new Promise(r => setTimeout(r, 800)); // UX delay
    
    addLog("> Reading dataset packet...");
    const parsedData = parseCSV(csvContent);
    setData(parsedData);
    await new Promise(r => setTimeout(r, 500));

    // Step 2: Profiling
    addLog("> Profiling columns and data types...");
    const computedStats = profileDataset(parsedData);
    setStats(computedStats);
    
    // Step 3: Context Agent
    addLog("> Context Agent: Scanning for identity...");
    const sample = parsedData.slice(0, 20);
    
    // Actual API Call
    // We simulate the split between Context and Strategy for UX, even though it's one sophisticated call
    const aiResult = await analyzeDatasetWithGemini(computedStats, sample);

    // Step 4: Strategy Agent (Simulated Processing of the response)
    addLog("> Context Lock Established.");
    await new Promise(r => setTimeout(r, 600));
    
    addLog("> Strategy Agent: Formulating pit stops...");
    await new Promise(r => setTimeout(r, 800)); // Give user time to read

    setAnalysis(aiResult);
    
    addLog("> Telemetry Online.");
    await new Promise(r => setTimeout(r, 800));

    setAppState(AppState.DASHBOARD);
  };

  const handleReset = () => {
    setAppState(AppState.UPLOAD);
    setData([]);
    setStats(null);
    setAnalysis(null);
    setProcessingLogs([]);
  };

  return (
    <Layout>
      {appState === AppState.UPLOAD && (
        <FileUpload onFileUpload={handleFileUpload} />
      )}

      {appState === AppState.PROCESSING && (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="w-full max-w-md">
            {/* Racing Radar Effect */}
            <div className="relative flex h-24 w-24 mx-auto mb-8 items-center justify-center">
               <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping"></div>
               <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-pulse"></div>
               <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>
               <div className="absolute top-0 left-1/2 h-1/2 w-[1px] bg-gradient-to-b from-transparent to-red-500 origin-bottom animate-spin duration-1000"></div>
            </div>
            
            <h2 className="text-center text-2xl font-black text-white uppercase tracking-widest mb-6">
              Processing Telemetry
            </h2>

            {/* Terminal Log Output */}
            <div className="bg-slate-950 border border-slate-800 rounded p-4 font-mono text-xs h-48 overflow-y-auto shadow-inner">
              {processingLogs.map((log, i) => (
                <div key={i} className="mb-1 text-slate-400">
                  <span className="text-red-500 mr-2">[{new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                  <span className={i === processingLogs.length - 1 ? "text-white animate-pulse" : ""}>{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      )}

      {appState === AppState.DASHBOARD && stats && analysis && (
        <Dashboard 
          data={data} 
          stats={stats} 
          analysis={analysis}
          onReset={handleReset}
        />
      )}
    </Layout>
  );
};

export default App;