
import { ColumnProfile, ColumnType, DataRow, DatasetStats, SemanticType, ChartConfig, RegressionResult, MonteCarloResult } from '../types';

// Simple CSV Parser
export const parseCSV = (csvText: string): DataRow[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: DataRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length === headers.length) {
      const row: DataRow = {};
      headers.forEach((header, index) => {
        const val = values[index];
        const num = parseFloat(val);
        row[header] = !isNaN(num) && isFinite(num) ? num : val;
      });
      data.push(row);
    }
  }
  return data;
};

// Heuristic to guess semantic context
const detectSemanticType = (header: string, type: ColumnType): SemanticType => {
  const lowerHeader = header.toLowerCase();
  
  if (['id', 'uuid', 'index'].some(k => lowerHeader.includes(k))) return SemanticType.ID;
  
  if (type === ColumnType.NUMERIC) {
    if (['price', 'cost', 'salary', 'revenue', 'amount', 'total', 'sales'].some(k => lowerHeader.includes(k))) {
      return SemanticType.CURRENCY;
    }
    if (['lat', 'lon', 'zip', 'coordinate'].some(k => lowerHeader.includes(k))) {
      return SemanticType.GEOGRAPHIC;
    }
  }

  if (type === ColumnType.DATE || ['date', 'time', 'year', 'month', 'day', 'timestamp'].some(k => lowerHeader.includes(k))) {
    return SemanticType.TEMPORAL;
  }

  return SemanticType.GENERAL;
};

// Calculate simple stats (Mean, SD)
const calculateStats = (values: number[]) => {
  if (values.length === 0) return { min: 0, max: 0, mean: 0, std: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return { min, max, mean, std: Math.sqrt(variance) };
};

// Pearson Correlation
const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  
  return denX === 0 || denY === 0 ? 0 : num / Math.sqrt(denX * denY);
};

// Linear Regression Calculation
const calculateRegression = (data: DataRow[], xCol: string, yCol: string): RegressionResult | undefined => {
  const points = data
    .map(row => ({ x: row[xCol] as number, y: row[yCol] as number }))
    .filter(p => !isNaN(p.x) && !isNaN(p.y));

  if (points.length < 2) return undefined;

  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  const sumXY = points.reduce((acc, p) => acc + (p.x * p.y), 0);
  const sumXX = points.reduce((acc, p) => acc + (p.x * p.x), 0);
  const sumYY = points.reduce((acc, p) => acc + (p.y * p.y), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R Squared
  const ssTot = sumYY - (sumY * sumY) / n;
  const ssRes = points.reduce((acc, p) => {
    const pred = slope * p.x + intercept;
    return acc + Math.pow(p.y - pred, 2);
  }, 0);
  const rSquared = 1 - (ssRes / ssTot);

  // Generate Trendline Points (Min X and Max X)
  const xValues = points.map(p => p.x);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  
  const trendline = [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept }
  ];

  return {
    xColumn: xCol,
    yColumn: yCol,
    slope,
    intercept,
    rSquared,
    equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
    trendline
  };
};

// Monte Carlo Simulation (Normal Distribution)
const runMonteCarlo = (data: DataRow[], col: string): MonteCarloResult | undefined => {
  const values = data.map(r => r[col] as number).filter(v => !isNaN(v));
  if (values.length < 10) return undefined;

  const { mean, std } = calculateStats(values);
  if (!mean || !std) return undefined;

  const iterations = 1000;
  const simulations: number[] = [];

  // Box-Muller transform for normal distribution
  for (let i = 0; i < iterations; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const simVal = mean + z * std;
    simulations.push(simVal);
  }

  simulations.sort((a, b) => a - b);
  const p10 = simulations[Math.floor(0.1 * iterations)];
  const p50 = simulations[Math.floor(0.5 * iterations)];
  const p90 = simulations[Math.floor(0.9 * iterations)];

  return {
    column: col,
    p10,
    p50,
    p90,
    iterations,
    mean,
    std
  };
};

// Outlier Detection using IQR
const findOutliers = (data: DataRow[], profiles: ColumnProfile[]): DataRow[] => {
  const numericCols = profiles.filter(p => p.type === ColumnType.NUMERIC && p.semanticType !== SemanticType.ID);
  if (numericCols.length === 0) return [];

  const outliers = new Set<DataRow>();

  numericCols.forEach(col => {
    const values = data.map(row => row[col.name] as number).sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    data.forEach(row => {
      const val = row[col.name] as number;
      if (val < lower || val > upper) {
        outliers.add(row);
      }
    });
  });

  return Array.from(outliers).slice(0, 50); // Limit to 50 for display
};

export const profileDataset = (data: DataRow[]): DatasetStats => {
  if (data.length === 0) {
    return { rowCount: 0, columnProfiles: [], outliers: [], narrativeInsights: [] };
  }

  const headers = Object.keys(data[0]);
  
  // 1. Profile Columns
  const profiles: ColumnProfile[] = headers.map(header => {
    let missing = 0;
    const distinctValues = new Set<string | number | boolean>();
    const numericValues: number[] = [];
    let isNumeric = true;

    data.forEach(row => {
      const val = row[header];
      if (val === null || val === '' || val === undefined) {
        missing++;
      } else {
        distinctValues.add(val);
        if (typeof val !== 'number') {
          isNumeric = false;
        } else {
          numericValues.push(val);
        }
      }
    });

    let type = ColumnType.UNKNOWN;
    if (isNumeric) type = ColumnType.NUMERIC;
    else if (distinctValues.size < 20 && distinctValues.size > 0) type = ColumnType.CATEGORICAL;
    else type = ColumnType.TEXT;

    if (type === ColumnType.TEXT) {
      const sample = Array.from(distinctValues)[0] as string;
      if (!isNaN(Date.parse(sample))) {
        type = ColumnType.DATE;
      }
    }

    const semanticType = detectSemanticType(header, type);
    const stats = isNumeric ? calculateStats(numericValues) : {};

    return {
      name: header,
      type,
      semanticType,
      missingCount: missing,
      uniqueCount: distinctValues.size,
      exampleValues: Array.from(distinctValues).slice(0, 5).map(String),
      ...stats
    };
  });

  // 2. Generate Narrative Insights & Find Regression Candidate
  const narrativeInsights: string[] = [];
  const numericCols = profiles.filter(p => p.type === ColumnType.NUMERIC && p.semanticType !== SemanticType.ID);
  
  // Correlation Insight & Regression Candidates
  let maxCorr = 0;
  let bestPair = '';
  let regressionCandidate: { x: string, y: string } | null = null;
  
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const colA = numericCols[i];
      const colB = numericCols[j];
      const valsA = data.map(r => r[colA.name] as number);
      const valsB = data.map(r => r[colB.name] as number);
      const corr = calculateCorrelation(valsA, valsB);
      
      if (Math.abs(corr) > Math.abs(maxCorr)) {
        maxCorr = corr;
        bestPair = `Strongest Relationship: "${colA.name}" ${corr > 0 ? 'increases' : 'decreases'} as "${colB.name}" increases (Correlation: ${corr.toFixed(2)})`;
        regressionCandidate = { x: colA.name, y: colB.name };
      }
    }
  }
  if (bestPair) narrativeInsights.push(bestPair);

  // Advanced Modeling Calculation
  let regressionResult: RegressionResult | undefined = undefined;
  let monteCarloResult: MonteCarloResult | undefined = undefined;

  // Calculate Regression for strongest pair if Correlation > 0.5
  if (regressionCandidate && Math.abs(maxCorr) > 0.5) {
      regressionResult = calculateRegression(data, regressionCandidate.x, regressionCandidate.y);
  }

  // Calculate Monte Carlo for Currency or High Variance column
  const mcCandidate = numericCols.find(c => c.semanticType === SemanticType.CURRENCY) || numericCols.sort((a,b) => (b.std || 0) - (a.std || 0))[0];
  if (mcCandidate) {
      monteCarloResult = runMonteCarlo(data, mcCandidate.name);
  }

  // Temporal Insight
  const dateCol = profiles.find(p => p.semanticType === SemanticType.TEMPORAL);
  if (dateCol) {
    narrativeInsights.push(`Temporal Context: Dataset contains time-series data based on "${dateCol.name}". Recommended: Time-series forecasting.`);
  }

  // Currency Insight
  const moneyCol = profiles.find(p => p.semanticType === SemanticType.CURRENCY);
  if (moneyCol && moneyCol.mean) {
    narrativeInsights.push(`Financial Context: "${moneyCol.name}" detected. Average Value: ${moneyCol.mean.toFixed(2)}.`);
  }

  // 3. Detect Outliers
  const outliers = findOutliers(data, profiles);
  if (outliers.length > 0) {
    narrativeInsights.push(`Anomaly Detection: Found ${outliers.length} potential outliers using IQR method.`);
  }

  return {
    rowCount: data.length,
    columnProfiles: profiles,
    outliers,
    narrativeInsights,
    advancedStats: {
        regression: regressionResult,
        monteCarlo: monteCarloResult
    }
  };
};

/**
 * Prepares data for visualization by handling:
 * 1. Aggregation (Group By) for Bar/Line charts
 * 2. Binning for high-cardinality numeric X-axis (e.g. Age -> 20-30)
 * 3. Counting for Categorical Y-axis
 * 4. Top N filtering for high-cardinality categorical X-axis
 */
export const prepareVisualData = (data: DataRow[], config: ChartConfig): any[] => {
  // Helper: Check if column is numeric
  const isNumeric = (key: string) => data.some(row => typeof row[key] === 'number');
  
  // 1. SCATTER: Return raw data (sampled if huge)
  if (config.type === 'scatter') {
    return data
      .filter(row => {
          const x = Number(row[config.xAxisKey]);
          const yKeys = config.dataKeys.length ? config.dataKeys : [];
          // Check X
          if (isNaN(x) || !isFinite(x)) return false;
          // Check Ys
          return yKeys.every(k => {
              const y = Number(row[k]);
              return !isNaN(y) && isFinite(y);
          });
      })
      .slice(0, 500); 
  }

  // 2. PIE: Aggregation (Count by X)
  if (config.type === 'pie') {
    const counts: Record<string, number> = {};
    data.forEach(row => {
      const key = String(row[config.xAxisKey]);
      if (key !== 'null' && key !== 'undefined' && key !== '') {
          counts[key] = (counts[key] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 segments
  }

  // 3. BAR / LINE: Grouping & Aggregation
  const xKey = config.xAxisKey;
  const yKeys = config.dataKeys;
  const isXNumeric = isNumeric(xKey);
  
  // Initial filtering of empty X-values
  let workingData = data.filter(r => r[xKey] !== null && r[xKey] !== undefined && r[xKey] !== '');
  let usedXKey = xKey;
  
  const distinctX = new Set(workingData.map(r => r[xKey])).size;

  // A) Binning logic for Numeric X with high cardinality (e.g. Age)
  if (isXNumeric && distinctX > 20) {
    const values = workingData.map(r => r[xKey] as number).filter(n => !isNaN(n));
    if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Fix: Avoid division by zero if min === max
        if (min === max) {
            usedXKey = xKey;
        } else {
            const binCount = 10;
            const binSize = (max - min) / binCount;
            
            workingData = workingData.map(row => {
               const val = row[xKey] as number;
               if (isNaN(val)) return { ...row, [`${xKey}_binned`]: 'Unknown' };
               const binIndex = Math.min(Math.floor((val - min) / binSize), binCount - 1);
               const binStart = min + (binIndex * binSize);
               const binEnd = min + ((binIndex + 1) * binSize);
               
               // Store new binned key with cleaner formatting
               const fmt = (n: number) => n % 1 === 0 ? n.toFixed(0) : n.toFixed(1);
               return { ...row, [`${xKey}_binned`]: `${fmt(binStart)} - ${fmt(binEnd)}` };
            });
            usedXKey = `${xKey}_binned`;
        }
    }
  }

  // B) Top N logic for Categorical X with high cardinality
  if (!isXNumeric && distinctX > 25) {
     // Find top 20 categories
     const counts: Record<string, number> = {};
     workingData.forEach(r => {
       const k = String(r[xKey]);
       counts[k] = (counts[k] || 0) + 1;
     });
     const topKeys = new Set(
       Object.entries(counts)
         .sort((a, b) => b[1] - a[1])
         .slice(0, 20)
         .map(e => e[0])
     );
     workingData = workingData.map(row => ({
       ...row,
       [xKey]: topKeys.has(String(row[xKey])) ? row[xKey] : 'Others'
     }));
  }

  // Group By usedXKey
  const groups: Record<string, any[]> = {};
  workingData.forEach(row => {
    const groupVal = String(row[usedXKey] ?? 'Unknown');
    if (!groups[groupVal]) groups[groupVal] = [];
    groups[groupVal].push(row);
  });

  // Aggregation
  return Object.entries(groups).map(([groupName, rows]) => {
    const result: any = { [config.xAxisKey]: groupName }; // map back to original key for chart XAxis
    
    if (yKeys.length === 0) {
        // No Y keys? Just count frequency
        result['count'] = rows.length;
    } else {
        yKeys.forEach(yKey => {
            if (isNumeric(yKey)) {
                // Numeric Target: MEAN
                const sum = rows.reduce((acc, curr) => acc + (Number(curr[yKey]) || 0), 0);
                const avg = sum / (rows.length || 1);
                // Safety: Recharts breaks with NaN/Infinity
                result[yKey] = isFinite(avg) ? parseFloat(avg.toFixed(2)) : 0;
            } else {
                // Categorical Target: COUNT (Frequency)
                result[yKey] = rows.length;
            }
        });
    }

    return result;
  }).sort((a, b) => {
      const keyA = String(a[config.xAxisKey]);
      const keyB = String(b[config.xAxisKey]);

      // Handle "Unknown" or nulls by pushing them to end
      if (keyA === 'Unknown') return 1;
      if (keyB === 'Unknown') return -1;
      if (keyA === 'Others') return 1;
      if (keyB === 'Others') return -1;

      // Extract numeric start if it's a range "10-20" or just "10"
      const extractNum = (s: string) => {
        // Match start of string number, possibly negative/decimal
        const match = s.match(/^(-?\d+(\.\d+)?)/); 
        return match ? parseFloat(match[0]) : NaN;
      };

      const numA = extractNum(keyA);
      const numB = extractNum(keyB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      // Check for Dates
      const dateA = Date.parse(keyA);
      const dateB = Date.parse(keyB);
      if (!isNaN(dateA) && !isNaN(dateB)) {
          return dateA - dateB;
      }

      // Fallback to standard locale compare for non-numeric strings
      return keyA.localeCompare(keyB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

export const calculateMetric = (data: DataRow[], column: string, op: string): string | number => {
  const values = data.map(d => d[column]).filter(v => typeof v === 'number') as number[];
  if (values.length === 0) return 'N/A';

  switch(op) {
    case 'sum': return values.reduce((a, b) => a + b, 0).toLocaleString();
    case 'mean': return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
    case 'max': return Math.max(...values).toLocaleString();
    case 'min': return Math.min(...values).toLocaleString();
    case 'count': return data.length.toLocaleString();
    default: return 'N/A';
  }
};
