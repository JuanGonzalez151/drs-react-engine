import React, { useState, useMemo, useEffect } from 'react';
import { AIAnalysisResult, ChartConfig, DatasetStats, DataRow, DashboardElement } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, Label } from 'recharts';
import { getDeepInsight, modifyDashboardWithGemini } from '../services/geminiService';
import { prepareVisualData, calculateMetric } from '../utils/dataUtils';

interface DashboardProps {
  data: DataRow[];
  stats: DatasetStats;
  analysis: AIAnalysisResult;
  onReset: () => void;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'];

// 1. Error Boundary for Charts ("Mechanical Failure")
class SafeChart extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
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
              <ChartComponent data={processedData} margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                
                <XAxis 
                  dataKey={config.xAxisKey} 
                  type={isScatter ? "number" : "category"}
                  domain={isScatter ? ['auto', 'auto'] : undefined}
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
                  cursor={isScatter ? { strokeDasharray: '3 3' } : { fill: 'rgba(239, 68, 68, 0.1)' }} 
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

  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());
  const toggleAction = (i: number) => {
    const s = new Set(completedActions);
    s.has(i) ? s.delete(i) : s.add(i);
    setCompletedActions(s);
  };

  // Init Layout
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
    
    try {
      setRadioStatus("Receiving transmission...");
      await new Promise(r => setTimeout(r, 500)); // UX

      setRadioStatus("Consulting Construct...");
      const cols = stats.columnProfiles.map(c => c.name).join(', ');
      
      const newLayout = await modifyDashboardWithGemini(drsLayout, radioMessage, cols);
      
      setRadioStatus("Updating Dashboard State...");
      await new Promise(r => setTimeout(r, 500)); // UX

      setDrsLayout(newLayout);
      setRadioMessage('');
    } catch (err) {
      console.error(err);
      setRadioStatus("Transmission Failed.");
    } finally {
      setIsTransmitting(false);
      setTimeout(() => setRadioStatus(''), 2000);
    }
  };

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

      {/* 2. RACE STRATEGY (BI Lap) */}
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

      {/* 3. DRS ENGINE (Dynamic Dashboard) */}
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

      {/* 4. RADIO CHECK (Chat Interface) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 p-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Radio Status Indicator */}
          {radioStatus && (
            <div className="absolute -top-10 left-4 flex items-center gap-2 bg-slate-900 border border-slate-700 text-red-400 px-3 py-1 text-[10px] font-mono uppercase font-bold tracking-wider rounded-t animate-pulse">
               <span>📡 STATUS:</span>
               <span>{radioStatus}</span>
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
                placeholder="Command: 'Add a lap time comparison', 'Remove the sector metric'..."
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