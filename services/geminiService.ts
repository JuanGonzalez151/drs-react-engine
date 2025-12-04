
import { GoogleGenAI } from "@google/genai";
import { AIAnalysisResult, DatasetStats, GroundingSource, DashboardElement, MissionSettings, RadioResponse } from '../types';

// Using Gemini 3.0 Pro for complex reasoning
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-pro-preview';

const extractJson = (text: string): any => {
  const jsonBlockMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (jsonBlockMatch) {
    return JSON.parse(jsonBlockMatch[1]);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Failed to parse JSON from AI response");
  }
};

export const analyzeDatasetWithGemini = async (
  stats: DatasetStats,
  sampleData: any[],
  settings: MissionSettings
): Promise<AIAnalysisResult> => {
  
  const personaDirective = settings.forcePersona 
    ? `CONTEXT OVERRIDE: User has manually set the target persona to: "${settings.forcePersona}". ADOPT THIS VIEWPOINT IMMEDIATELY. DO NOT DEDUCE A NEW ONE.`
    : `CRITICAL STEP: Identify the specific JOB TITLE or PERSONA that would find this dataset most valuable (e.g., If F1 data -> 'Head of Race Strategy'; If Sales data -> 'Chief Revenue Officer').`;

  const goalDirective = settings.analysisGoal
    ? `MISSION OBJECTIVE OVERRIDE: The user has explicitly stated their goal: "${settings.analysisGoal}". ALL INSIGHTS AND ACTIONS MUST DIRECTLY ADDRESS THIS OBJECTIVE.`
    : ``;

  const groundingDirective = settings.enableGrounding
    ? `1. **TARGET CHECK (Grounding):** USE GOOGLE SEARCH to identify the specific dataset (e.g., "F1 2024 Bahrain Telemetry", "UCI Heart Disease").`
    : `1. **TARGET CHECK:** Analyze internal data patterns to deduce the context. (External Search Disabled).`;

  const depthDirective = settings.deepScan
    ? `PERFORM EXHAUSTIVE ANALYSIS. Look for subtle correlations and edge cases.`
    : `Perform standard analysis.`;

  // Format Advanced Stats for the prompt
  let advancedStatsContext = "No advanced modeling available.";
  if (settings.predictiveModeling && stats.advancedStats) {
      const reg = stats.advancedStats.regression;
      const mc = stats.advancedStats.monteCarlo;
      advancedStatsContext = `
        PREDICTIVE MODELING DATA (Use these to justify your strategy):
        ${reg ? `- Regression Trend: "${reg.xColumn}" vs "${reg.yColumn}". Equation: ${reg.equation} (R²: ${reg.rSquared.toFixed(3)}).` : ''}
        ${mc ? `- Monte Carlo Risk Analysis (${mc.column}): P10 (Pessimistic): ${mc.p10.toFixed(2)}, P50 (Expected): ${mc.p50.toFixed(2)}, P90 (Optimistic): ${mc.p90.toFixed(2)}.` : ''}
      `;
  }

  const promptContext = `
    You are a top-tier Consultant and Chief Race Strategy Engineer for the "DRS" (Data Reasoning System).
    
    OBJECTIVE:
    Research the provided dataset to identify its REAL-WORLD CONTEXT.
    ${personaDirective}
    ${goalDirective}
    
    Then, act as an advisor to that [TARGET PERSONA]. Analyze the data and provide insights specifically for THEM. Use their professional jargon. Do not explain basics; focus on high-level strategy relevant to their job.
    ${depthDirective}

    DATA TELEMETRY:
    Rows: ${stats.rowCount}
    Columns: ${stats.columnProfiles.map(c => `${c.name} (${c.type}, Unique: ${c.uniqueCount}, Missing: ${c.missingCount})`).join(', ')}
    
    ${advancedStatsContext}

    SAMPLE DATA:
    ${JSON.stringify(sampleData.slice(0, 5))}
    
    MISSION PROTOCOL:
    ${groundingDirective}
    2. **PERSONA ID:** Deduce (or Confirm) the [TARGET PERSONA].
    3. **RACE STRATEGY (Executive Insights):** Provide 3 HIGH-LEVEL STRATEGIC INSIGHTS for the [TARGET PERSONA]. Focus on trends, risks, or opportunities. Quote the Predictive Modeling Data if relevant.
    4. **PIT STOP ACTIONS (Prescriptive):** Generate a checklist of 3-5 CONCRETE ACTION ITEMS for the [TARGET PERSONA]. Be specific.
    5. **DASHBOARD CONFIG:** Suggest 3 charts to visualize the most important telemetry for this persona.

    VISUALIZATION PROTOCOL:
    - DO NOT suggest charts for columns with 1 unique value (Constants).
    - DO NOT suggest Bar/Pie charts for columns with > 50 unique values (High Cardinality) -> Use Scatter or binning suggestions.
    - PREFER Line Charts for Temporal data.
    - PREFER Bar Charts for Categorical comparisons.

    OUTPUT FORMAT (JSON ONLY):
    {
      "datasetName": "Official Dataset Name",
      "topic": "Domain (e.g. Motorsport, Finance)",
      "userPersona": "The Target Persona",
      "problemType": "Classification/Regression/etc",
      "targetVariableSuggestion": "target_col",
      "summary": "Brief mission briefing for the persona.",
      "cleaningSuggestions": ["Action 1", "Action 2"],
      "executiveInsights": ["Strategic Insight 1", "Strategic Insight 2", "Strategic Insight 3"],
      "recommendedActions": ["Action Item 1", "Action Item 2", "Action Item 3"],
      "suggestedCharts": [
        {
          "id": "telemetry_1",
          "title": "Chart Title",
          "type": "bar" | "line" | "scatter" | "pie",
          "xAxisKey": "col_x",
          "dataKeys": ["col_y"], 
          "description": "Tactical reason for this view."
        }
      ]
    }
  `;

  // Configure tools based on MissionSettings
  const tools = settings.enableGrounding ? [{ googleSearch: {} }] : undefined;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptContext,
      config: {
        tools: tools,
        temperature: settings.deepScan ? 0.4 : 0.3, 
      }
    });

    // Extract Grounding Sources
    const groundingSources: GroundingSource[] = [];
    if (settings.enableGrounding) {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        chunks.forEach(chunk => {
        if (chunk.web?.uri && chunk.web?.title) {
            groundingSources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
            });
        }
        });
    }

    const text = response.text || "{}";
    const result = extractJson(text);

    return {
      executiveInsights: ["Telemetry unclear.", "Maintain current course."],
      recommendedActions: ["Check sensors.", "Verify data integrity."],
      userPersona: result.userPersona || (settings.forcePersona || "Data Analyst"),
      ...result,
      groundingSources: groundingSources
    };

  } catch (error) {
    console.error("DRS Analysis Failed:", error);
    return {
      datasetName: "Unknown Signal",
      topic: "General Data",
      userPersona: settings.forcePersona || "System Operator",
      problemType: "Unknown",
      targetVariableSuggestion: null,
      summary: "Unable to establish semantic lock on data source.",
      cleaningSuggestions: [],
      suggestedCharts: [],
      groundingSources: [],
      executiveInsights: ["Communication failure with logic core."],
      recommendedActions: ["Manual inspection required."]
    };
  }
};

export const getDeepInsight = async (
  chartTitle: string,
  chartContext: string,
  datasetTopic: string,
  dataSummary: string
): Promise<string> => {
  const prompt = `
    ROLE: Senior Strategy Consultant / Race Engineer.
    CONTEXT: "${datasetTopic}".
    TELEMETRY: Chart "${chartTitle}" shows ${chartContext}.
    ADAPTIVE TONE PROTOCOL:
    - If the context implies technical expertise (e.g. Engineer, Scientist), use precise technical vocabulary.
    - If the context implies business leadership (e.g. CEO, Manager), use strategic, clear, impact-focused language.
    
    TASK: Provide a concise tactical observation (max 2 sentences) and one immediate adjustment.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  return response.text || "No tactical data available.";
};

export const processRadioCommand = async (
  currentLayout: DashboardElement[],
  userCommand: string,
  columnInfo: string,
  datasetContext: string
): Promise<RadioResponse> => {
  
  const prompt = `
    ROLE: You are the Lead Analyst for the "DRS" (Data Reasoning System).
    
    YOUR PROTOCOL:
    1. **Listen:** Interpret the "Radio" input: "${userCommand}".
    2. **Classify:**
       - IS IT A QUESTION? (e.g., "Why is revenue down?") -> Search the context and answer clearly and professionally.
       - IS IT A COMMAND? (e.g., "Add a metric for Cost") -> Modify the global analysis logic/dashboard.
    3. **Report:** You must explicitly state what actions you took in the "System Action" block.

    ADAPTIVE TONE PROTOCOL:
    - Adjust vocabulary complexity based on the query. Simple question = Simple answer. Technical command = Technical confirmation.

    CONTEXT:
    - Dataset: ${datasetContext}
    - Available Columns: ${columnInfo}
    - Current Dashboard Layout: ${JSON.stringify(currentLayout)}

    OUTPUT FORMAT (JSON ONLY):
    {
      "chatResponse": "[Your direct, conversational answer or confirmation to the user goes here.]",
      "systemLog": {
         "actionTaken": "[e.g. Updated Dashboard / Analyzed Trend / Queried Knowledge Base]",
         "scope": "[e.g. Dashboard Layout / Global Dataset / Specific Metric]",
         "newAnalysisState": "[Briefly explain the result or how the analysis has shifted.]"
      },
      "updatedLayout": [ ... ] // Include ONLY if the command requires changing the dashboard structure. Otherwise null.
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { 
      temperature: 0.2,
      tools: [{ googleSearch: {} }] // Allow search for Q&A
    }
  });

  try {
    return extractJson(response.text || "{}");
  } catch (e) {
    console.error("Radio processing failed", e);
    return {
      chatResponse: "Signal interference. Unable to process command.",
      systemLog: {
        actionTaken: "Error Handling",
        scope: "Radio System",
        newAnalysisState: "Reverting to previous stable state."
      },
      updatedLayout: undefined
    };
  }
};
