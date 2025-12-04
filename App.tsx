
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { MissionConfig } from './components/MissionConfig';
import { Dashboard } from './components/Dashboard';
import { parseCSV, profileDataset } from './utils/dataUtils';
import { analyzeDatasetWithGemini } from './services/geminiService';
import { AppState, DataRow, DatasetStats, AIAnalysisResult, MissionSettings } from './types';

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

  // Step 1: Handle File Drop -> Go to Config
  const handleFileIngest = async (csvContent: string) => {
    setProcessingLogs([]);
    const parsedData = parseCSV(csvContent);
    
    if (parsedData.length === 0) {
        alert("Empty dataset.");
        return;
    }

    setData(parsedData);
    const computedStats = profileDataset(parsedData);
    setStats(computedStats);
    setAppState(AppState.CONFIG);
  };

  // Step 2: Config Confirmed -> Start Processing
  const handleSystemStart = async (settings: MissionSettings) => {
    if (!data || !stats) return;

    setAppState(AppState.PROCESSING);

    // Sequence Simulation
    addLog("> INITIALIZING DRS TELEMETRY...");
    await new Promise(r => setTimeout(r, 600)); 
    
    addLog(`> Mission Profile Loaded: ${settings.forcePersona ? 'MANUAL OVERRIDE' : 'AUTO-DETECT'}`);
    addLog(`> Grounding Systems: ${settings.enableGrounding ? 'ONLINE' : 'OFFLINE'}`);
    await new Promise(r => setTimeout(r, 500));

    // Step 3: Context Agent
    addLog("> Context Agent: Scanning for identity...");
    const sample = data.slice(0, 20);
    
    // API Call with Settings
    const aiResult = await analyzeDatasetWithGemini(stats, sample, settings);

    // Step 4: Strategy Agent
    addLog("> Context Lock Established.");
    await new Promise(r => setTimeout(r, 600));
    
    addLog("> Strategy Agent: Formulating pit stops...");
    await new Promise(r => setTimeout(r, 800)); 

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
        <FileUpload onFileUpload={handleFileIngest} />
      )}

      {appState === AppState.CONFIG && stats && (
         <MissionConfig 
            stats={stats}
            onConfirm={handleSystemStart}
            onCancel={handleReset}
         />
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
