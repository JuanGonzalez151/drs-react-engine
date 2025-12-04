
import React, { useState, useMemo, useEffect } from 'react';
import { AIAnalysisResult, ChartConfig, DatasetStats, DataRow, DashboardElement, RadioResponse } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, Label, ComposedChart } from 'recharts';
import { getDeepInsight, processRadioCommand } from '../services/geminiService';
import { prepareVisualData, calculateMetric } from '../utils/dataUtils';

interface DashboardProps {
  data: DataRow[];
  stats: DatasetStats;
  analysis: AIAnalysisResult;
  onReset: () => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'];

// Define Props and State for Error Boundary
interface SafeChartProps {
  children?: React.ReactNode;
}

interface SafeChartState {
  hasError: boolean;
}

// 1. Error Boundary for Charts ("Mechanical Failure")
class SafeChart extends React.Component<SafeChartProps, SafeChartState> {
  constructor(props: SafeChartProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: any): SafeChartState {
    return { hasError: true };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Chart Mechanical Failure:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-900/50 p-4 text-center border border-red-900/30 rounded-lg">
          <svg className="h-10 w-10 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-mono text-red-400">MECHANICAL FAILURE</p>
          <p className="text-xs text-slate-500">Telemetry rendering failed.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-none border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-sm z-50">
        <p className="mb-2 border-b border-slate-800 pb-1 text-xs font-mono font-bold text-slate-400 uppercase">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-mono">
              <div className="h-2 w-2" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400 uppercase text-[10px]">{entry.name}:</span>
              <span className="text-white">{typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const SmartChart: React.FC<{ config: ChartConfig; data: DataRow[]; topic: string; summary: string }> = ({ config, data, topic, summary }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processedData = useMemo(() => prepareVisualData(data, config), [data, config]);

  const handleDeepInsight = async () => {
    setIsLoading(true);
    try {
      const chartContext = processedData.slice(0, 10).map(row => JSON.stringify(row)).join('; ');
      const result = await getDeepInsight(config.title, chartContext, topic, summary);
      setInsight(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  let ChartComponent: any = BarChart;
  if (config.type === 'line') ChartComponent = LineChart;
  if (config.type === 'scatter') ChartComponent = ScatterChart;

  const renderKeys = config.dataKeys.length > 0 ? config.dataKeys : ['count'];
  const isScatter = config.type === 'scatter';
  
  // Memoize props objects to prevent re-renders
  const margin = useMemo(() => ({ top: 10, right: 30, bottom: 30, left: 20 }), []);
  const scatterDomain = useMemo(() => (['auto', 'auto']), []);
  const scatterCursor = useMemo(() => ({ strokeDasharray: '3 3' }), []);
  const barCursor = useMemo(() => ({ fill: 'rgba(239, 68, 68, 0.1)' }), []);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wide border-l-2 border-red-500 pl-2">{config.title}</h3>
          <p className="text-[10px] text-slate-500 font-mono mt-1 pl-2.5">{config.description}</p>
        </div>
        <button 
          onClick={handleDeepInsight}
          disabled={isLoading}
          className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1 rounded-sm border border-slate-700 transition-colors"
        >
          {isLoading ? 'ANALYZING...' : 'TACTICAL ANALYSIS'}
        </button>
      </div>
      
      <div className="flex-grow min-h-[250px]">
        <SafeChart>
          <ResponsiveContainer width="100%" height="100%">
            {config.type === 'pie' ? (
              <PieChart>
                <Pie data={processedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" stroke="none">
                  {processedData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              </PieChart>
            ) : (
              <ChartComponent data={processedData} margin={margin}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                
                <XAxis 
                  dataKey={config.xAxisKey} 
                  type={isScatter ? "number" : "category"}
                  domain={isScatter ? scatterDomain : undefined}
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontFamily: 'monospace' }} 
                  height={50}
                >
                  <Label value={config.xAxisKey} offset={0} position="insideBottom" fill="#475569" fontSize={10} fontFamily="monospace" />
                </XAxis>
                
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontFamily: 'monospace' }} 
                  width={50}
                >
                  <Label 
                    value={renderKeys.join(' / ')} 
                    angle={-90} 
                    position="insideLeft" 
                    style={{ textAnchor: 'middle' }} 
                    offset={10} 
                    fill="#475569" 
                    fontSize={10} 
                    fontFamily="monospace"
                  />
                </YAxis>

                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={isScatter ? scatterCursor : barCursor} 
                />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }} />
                
                {renderKeys.map((key, idx) => (
                  config.type === 'line' 
                    ? <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx]} dot={false} strokeWidth={2} activeDot={{ r: 4, stroke: 'white' }} />
                    : config.type === 'scatter'
                      ? <Scatter key={key} name={key} dataKey={key} fill={COLORS[idx]} />
                      : <Bar key={key} dataKey={key} fill={COLORS[idx]} radius={[2, 2, 0, 0]} />
                ))}
              </ChartComponent>
            )}
          </ResponsiveContainer>
        </SafeChart>
      </div>
      {insight && (
        <div className="mt-3 p-3 bg-slate-800/50 border-l-2 border-yellow-500 animate-fadeIn">
           <p className="text-xs font-mono text-yellow-100">{insight}</p>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ data, stats, analysis, onReset }) => {
  const [drsLayout, setDrsLayout] = useState<DashboardElement[]>([]);
  const [radioMessage, setRadioMessage] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [radioStatus, setRadioStatus] = useState('');
  const [isContextExpanded, setIsContextExpanded] = useState(true);

  // Radio Response State
  const [radioResponse, setRadioResponse] = useState<RadioResponse | null>(null);

  // Advanced Modeling Insights State
  const [regInsight, setRegInsight] = useState<string | null>(null);
  const [isRegLoading, setIsRegLoading] = useState(false);
  const [mcInsight, setMcInsight] = useState<string | null>(null);
  const [isMcLoading, setIsMcLoading] = useState(false);

  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());
  const toggleAction = (i: number) => {
    const s = new Set(completedActions);
    s.has(i) ? s.delete(i) : s.add(i);
    setCompletedActions(s);
  };

  // Init Layout - Run only when analysis ID changes (assuming analysis object is stable from App)
  useEffect(() => {
    if (analysis.suggestedCharts) {
      const initial: DashboardElement[] = analysis.suggestedCharts.map(chart => ({
        id: chart.id,
        type: 'chart' as const,
        w: 1,
        chartConfig: chart
      }));
      setDrsLayout(initial);
    }
  }, [analysis]);

  const handleRadioCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!radioMessage.trim()) return;
    setIsTransmitting(true);
    setRadioResponse(null); // Clear previous response
    
    try {
      setRadioStatus("Receiving transmission...");
      await new Promise(r => setTimeout(r, 500)); // UX

      setRadioStatus("Consulting Construct...");
      const cols = stats.columnProfiles.map(c => c.name).join(', ');
      
      const response = await processRadioCommand(drsLayout, radioMessage, cols, analysis.summary);
      
      setRadioStatus("Processing Response...");
      await new Promise(r => setTimeout(r, 500)); // UX

      // Update State
      setRadioResponse(response);
      if (response.updatedLayout) {
        setDrsLayout(response.updatedLayout);
      }
      setRadioMessage('');

    } catch (err) {
      console.error(err);
      setRadioStatus("Transmission Failed.");
    } finally {
      setIsTransmitting(false);
      setTimeout(() => setRadioStatus(''), 2000);
    }
  };

  const handleRegInsight = async () => {
    if (!stats.advancedStats?.regression) return;
    setIsRegLoading(true);
    const r = stats.advancedStats.regression;
    try {
        const context = `Linear Model: ${r.equation}. Strength (R2): ${r.rSquared.toFixed(3)}. Trend: ${r.slope > 0 ? 'Positive' : 'Negative'}.`;
        const result = await getDeepInsight(`Regression: ${r.xColumn} vs ${r.yColumn}`, context, analysis.topic, analysis.summary);
        setRegInsight(result);
    } catch (e) { console.error(e); }
    finally { setIsRegLoading(false); }
  };

  const handleMcInsight = async () => {
    if (!stats.advancedStats?.monteCarlo) return;
    setIsMcLoading(true);
    const m = stats.advancedStats.monteCarlo;
    try {
        const context = `Simulation for ${m.column}. Pessimistic (P10): ${m.p10.toFixed(2)}, Expected (P50): ${m.p50.toFixed(2)}, Optimistic (P90): ${m.p90.toFixed(2)}.`;
        const result = await getDeepInsight(`Monte Carlo Risk Analysis`, context, analysis.topic, analysis.summary);
        setMcInsight(result);
    } catch (e) { console.error(e); }
    finally { setIsMcLoading(false); }
  };

  const hasAdvancedStats = !!stats.advancedStats;
  const reg = stats.advancedStats?.regression;
  const mc = stats.advancedStats?.monteCarlo;

  // Memoize Composed Chart config
  const composedMargin = useMemo(() => ({ top: 10, right: 30, bottom: 20, left: 10 }), []);
  const composedDomain = useMemo(() => (['auto', 'auto']), []);
  const composedCursor = useMemo(() => ({ strokeDasharray: '3 3' }), []);

  return (
    <div className="space-y-8 pb-32">
      
      {/* 1. HEADER & CONTEXT CHECK (Grounding) */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">{analysis.datasetName}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-sm bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">LIVE TELEMETRY</span>
              <span className="text-sm text-slate-400 font-mono">{analysis.topic} Sector</span>
            </div>
          </div>
          <button onClick={onReset} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono uppercase tracking-wider transition-colors">
            Disconnect Stream
          </button>
        </div>

        {/* Target Data Detected Expander */}
        <div className="rounded-none border border-slate-700 bg-slate-900/50 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-900 border-b border-slate-800">
             <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${analysis.groundingSources.length > 0 ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                  TARGET DATA DETECTED
                </span>
                <div className="h-4 w-[1px] bg-slate-700"></div>
                <span className="text-xs text-red-400 font-mono uppercase tracking-wider font-bold">
                  SYSTEM IDENTITY DETECTED: [{analysis.userPersona}]
                </span>
             </div>
             <button onClick={() => setIsContextExpanded(!isContextExpanded)}>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${isContextExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </button>
          </div>
          
          {isContextExpanded && (
            <div className="p-4">
              <p className="text-sm text-slate-300 leading-relaxed mb-3">{analysis.summary}</p>
              {analysis.groundingSources.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {analysis.groundingSources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400 hover:text-blue-300 hover:underline bg-blue-900/20 px-2 py-1 rounded border border-blue-500/20">
                      🔗 {s.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. ADVANCED TELEMETRY MODELING (New Section) */}
      {hasAdvancedStats && (reg || mc) && (
        <div className="border border-slate-800 bg-slate-900/30 p-6 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-2 opacity-50">
              <span className="text-[10px] font-mono text-emerald-500 border border-emerald-900 bg-emerald-900/20 px-2 py-1 uppercase tracking-wider">Predictive Modeling Active</span>
           </div>
           
           <h2 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2 mb-6">
             <span className="text-emerald-500">⚡</span>
             Advanced Telemetry Modeling
           </h2>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Regression Module */}
              {reg && (
                 <div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold text-slate-400 font-mono uppercase border-l-2 border-emerald-500 pl-2">
                            Linear Correlation: {reg.xColumn} vs {reg.yColumn}
                        </h3>
                        <button
                            onClick={handleRegInsight}
                            disabled={isRegLoading}
                            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1 rounded-sm border border-slate-700 transition-colors"
                        >
                            {isRegLoading ? 'CALCULATING...' : 'TACTICAL ANALYSIS'}
                        </button>
                    </div>
                    <div className="h-[250px] bg-slate-900 border border-slate-800 p-2">
                       <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart margin={composedMargin}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                           <XAxis dataKey="x" type="number" domain={composedDomain} stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                           <YAxis dataKey="y" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                           <Tooltip content={<CustomTooltip />} cursor={composedCursor} />
                           <Scatter name="Data" data={data.map(r => ({ x: r[reg.xColumn], y: r[reg.yColumn] })).slice(0, 200)} fill="#10b981" fillOpacity={0.6} />
                           <Line 
                              type="monotone" 
                              data={reg.trendline} 
                              dataKey="y" 
                              stroke="#ef4444" 
                              strokeWidth={2} 
                              dot={false} 
                              activeDot={false} 
                              isAnimationActive={false}
                           />
                         </ComposedChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-mono text-slate-500">
                       <span>EQ: {reg.equation}</span>
                       <span className="text-emerald-400">R² Strength: {reg.rSquared.toFixed(3)}</span>
                    </div>
                    {regInsight && (
                        <div className="mt-3 p-3 bg-slate-800/50 border-l-2 border-emerald-500 animate-fadeIn">
                           <p className="text-xs font-mono text-emerald-100">{regInsight}</p>
                        </div>
                    )}
                 </div>
              )}

              {/* Monte Carlo Module */}
              {mc && (
                 <div>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xs font-bold text-slate-400 font-mono uppercase border-l-2 border-purple-500 pl-2">
                            Monte Carlo Risk Analysis ({mc.iterations} Iterations)
                        </h3>
                        <button
                            onClick={handleMcInsight}
                            disabled={isMcLoading}
                            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1 rounded-sm border border-slate-700 transition-colors"
                        >
                            {isMcLoading ? 'CALCULATING...' : 'TACTICAL ANALYSIS'}
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                       <div className="bg-slate-950 border border-slate-800 p-3 text-center">
                          <p className="text-[10px] text-slate-500 uppercase">P10 (Pessimistic)</p>
                          <p className="text-xl font-mono font-bold text-red-400 mt-1">{mc.p10.toFixed(1)}</p>
                       </div>
                       <div className="bg-slate-950 border border-slate-800 p-3 text-center">
                          <p className="text-[10px] text-slate-500 uppercase">P50 (Expected)</p>
                          <p className="text-xl font-mono font-bold text-yellow-400 mt-1">{mc.p50.toFixed(1)}</p>
                       </div>
                       <div className="bg-slate-950 border border-slate-800 p-3 text-center">
                          <p className="text-[10px] text-slate-500 uppercase">P90 (Optimistic)</p>
                          <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{mc.p90.toFixed(1)}</p>
                       </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800 text-xs text-slate-400 leading-relaxed font-mono">
                       Simulated forecast for <span className="text-white">{mc.column}</span> based on historical variance (σ: {mc.std.toFixed(2)}). 
                       There is a 90% probability values will exceed P10 and a 10% probability they will exceed P90.
                    </div>
                    {mcInsight && (
                        <div className="mt-3 p-3 bg-slate-800/50 border-l-2 border-purple-500 animate-fadeIn">
                           <p className="text-xs font-mono text-purple-100">{mcInsight}</p>
                        </div>
                    )}
                 </div>
              )}
           </div>
        </div>
      )}

      {/* 3. RACE STRATEGY (BI Lap) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insights */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500">🏁</span>
            <div>
                <h2 className="text-lg font-bold text-white uppercase tracking-wide leading-none">Race Strategy</h2>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mt-1">
                  Strategic Advisory for: <span className="text-red-400">{analysis.userPersona}</span>
                </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(analysis.executiveInsights || []).map((insight, i) => (
              <div key={i} className="relative p-5 bg-slate-900 border-l-4 border-indigo-500 shadow-lg hover:bg-slate-800 transition-colors">
                <span className="absolute top-2 right-2 text-[10px] font-mono text-slate-600">OBSERVATION {i + 1}</span>
                <p className="text-slate-200 font-medium text-sm leading-relaxed mt-2">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pit Stop Actions */}
        <div className="bg-slate-900 border border-slate-800 p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <span className="animate-pulse h-2 w-2 rounded-full bg-yellow-500"></span>
            Pit Stop Actions
          </h2>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-4 ml-4">
            Prescriptive Checklist for {analysis.userPersona}
          </p>
          <div className="space-y-3">
            {(analysis.recommendedActions || []).map((action, i) => (
              <label key={i} className={`flex items-start gap-3 p-2 cursor-pointer group transition-all ${completedActions.has(i) ? 'opacity-50' : 'opacity-100'}`}>
                 <div className="relative flex items-center pt-0.5">
                    <input 
                      type="checkbox" 
                      checked={completedActions.has(i)}
                      onChange={() => toggleAction(i)}
                      className="peer appearance-none h-4 w-4 border border-slate-600 rounded-none bg-slate-800 checked:bg-red-500 checked:border-red-500 focus:ring-0 transition-colors"
                    />
                    <svg className="absolute w-3 h-3 text-white pointer-events-none hidden peer-checked:block left-0.5 top-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <span className={`text-xs font-mono ${completedActions.has(i) ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'}`}>{action}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 4. DRS ENGINE (Dynamic Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drsLayout.map((el, idx) => {
          const spanClass = el.w === 2 ? 'md:col-span-2' : 'md:col-span-1';
          
          if (el.type === 'header') return <div key={idx} className={`${spanClass} pt-4 border-t border-slate-800`}><h2 className="text-2xl font-bold text-white uppercase">{el.content}</h2></div>;
          
          if (el.type === 'metric') {
            const val = calculateMetric(data, el.metricColumn || '', el.metricOperation || 'count');
            return (
              <div key={idx} className="p-6 bg-slate-900 border border-slate-800">
                 <p className="text-xs text-slate-500 font-mono uppercase">{el.metricLabel || el.metricColumn}</p>
                 <p className="text-4xl font-black text-white mt-1 font-mono">{val}</p>
              </div>
            );
          }

          if (el.type === 'text') return <div key={idx} className={`${spanClass} p-4 bg-slate-900/50 text-slate-400 text-sm font-mono border border-slate-800`}>{el.content}</div>;
          
          if (el.type === 'chart' && el.chartConfig) {
            return (
              <div key={idx} className={`${spanClass} min-h-[350px] bg-slate-900 border border-slate-800 p-4 shadow-md hover:border-slate-700 transition-colors`}>
                <SmartChart config={el.chartConfig} data={data} topic={analysis.topic} summary={analysis.summary} />
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* 5. RADIO CHECK (Chat Interface) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          
          {/* Radio Status Indicator */}
          {radioStatus && (
            <div className="absolute -top-10 left-4 flex items-center gap-2 bg-slate-900 border border-slate-700 text-red-400 px-3 py-1 text-[10px] font-mono uppercase font-bold tracking-wider rounded-t animate-pulse">
               <span>📡 STATUS:</span>
               <span>{radioStatus}</span>
            </div>
          )}

          {/* AI Response Display (Chat & System Log) */}
          {radioResponse && (
            <div className="animate-slideUp bg-slate-900 border border-slate-700 rounded-sm overflow-hidden shadow-2xl mb-2">
               {/* Header */}
               <div className="flex items-center justify-between px-3 py-1 bg-slate-950 border-b border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">DRS Transmission Log</span>
                  <button onClick={() => setRadioResponse(null)} className="text-slate-500 hover:text-white">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               
               {/* Content */}
               <div className="p-4 grid gap-4">
                  {/* Chat Response */}
                  <div className="flex gap-3">
                     <div className="h-6 w-6 rounded bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">AI</div>
                     <p className="text-sm text-slate-300 font-mono leading-relaxed">{radioResponse.chatResponse}</p>
                  </div>

                  {/* System Action Log */}
                  {radioResponse.systemLog && (
                    <div className="bg-black/40 border border-slate-800 p-3 font-mono text-xs space-y-2 rounded">
                      <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase border-b border-slate-800 pb-2 mb-2">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        System Actions & Analysis Log
                      </div>
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-slate-500">ACTION:</span>
                        <span className="text-white">{radioResponse.systemLog.actionTaken}</span>
                        
                        <span className="text-slate-500">SCOPE:</span>
                        <span className="text-white">{radioResponse.systemLog.scope}</span>
                        
                        <span className="text-slate-500">STATE:</span>
                        <span className="text-emerald-400">{radioResponse.systemLog.newAnalysisState}</span>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          <form onSubmit={handleRadioCheck} className="relative flex items-center gap-4">
            <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold uppercase tracking-widest whitespace-nowrap">
              <span className={`h-2 w-2 rounded-full bg-red-500 ${isTransmitting ? 'animate-ping' : ''}`}></span>
              Radio to DRS
            </div>
            <div className="relative flex-grow group">
              <input 
                type="text" 
                value={radioMessage}
                onChange={(e) => setRadioMessage(e.target.value)}
                placeholder="Ask a question ('Why is cost high?') or Command ('Add revenue chart')..."
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono text-sm px-4 py-3 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-slate-600"
                disabled={isTransmitting}
              />
              <div className="absolute right-2 top-2 bottom-2">
                 <button 
                  type="submit" 
                  disabled={isTransmitting}
                  className="h-full px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                 >
                   {isTransmitting ? 'TX...' : 'SEND'}
                 </button>
              </div>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};
