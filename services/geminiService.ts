
import { GoogleGenAI } from "@google/genai";
import { AIAnalysisResult, DatasetStats, GroundingSource, DashboardElement } from '../types';

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
  sampleData: any[]
): Promise<AIAnalysisResult> => {
  
  const promptContext = `
    You are a top-tier Consultant and Chief Race Strategy Engineer for the "DRS" (Data Reasoning System).
    
    OBJECTIVE:
    Research the provided dataset to identify its REAL-WORLD CONTEXT.
    CRITICAL STEP: Identify the specific JOB TITLE or PERSONA that would find this dataset most valuable (e.g., If F1 data -> 'Head of Race Strategy'; If Sales data -> 'Chief Revenue Officer'; If Medical -> 'Senior Cardiologist').
    
    Then, act as an advisor to that [TARGET PERSONA]. Analyze the data and provide insights specifically for THEM. Use their professional jargon. Do not explain basics; focus on high-level strategy relevant to their job.

    DATA TELEMETRY:
    Rows: ${stats.rowCount}
    Columns: ${stats.columnProfiles.map(c => `${c.name} (${c.type})`).join(', ')}
    
    SAMPLE DATA:
    ${JSON.stringify(sampleData.slice(0, 5))}
    
    MISSION PROTOCOL:
    1. **TARGET CHECK (Grounding):** USE GOOGLE SEARCH to identify the specific dataset (e.g., "F1 2024 Bahrain Telemetry", "UCI Heart Disease").
    2. **PERSONA ID:** Deduce the specific [TARGET PERSONA].
    3. **RACE STRATEGY (Executive Insights):** Provide 3 HIGH-LEVEL STRATEGIC INSIGHTS for the [TARGET PERSONA]. Focus on trends, risks, or opportunities. (e.g., "Tire degradation in Sector 2 indicates localized track temperature anomaly", "Q3 Revenue risk detected in APAC region").
    4. **PIT STOP ACTIONS (Prescriptive):** Generate a checklist of 3-5 CONCRETE ACTION ITEMS for the [TARGET PERSONA]. Be specific. (e.g., "Increase front-wing angle by 0.5 degrees", "Reallocate marketing spend to Video Ad units").
    5. **DASHBOARD CONFIG:** Suggest 3 charts to visualize the most important telemetry for this persona.

    OUTPUT FORMAT (JSON ONLY):
    {
      "datasetName": "Official Dataset Name",
      "topic": "Domain (e.g. Motorsport, Finance)",
      "userPersona": "The Deduced Target Persona",
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

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: promptContext,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3, 
      }
    });

    // Extract Grounding Sources
    const groundingSources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) {
        groundingSources.push({
          title: chunk.web.title,
          uri: chunk.web.uri
        });
      }
    });

    const text = response.text || "{}";
    const result = extractJson(text);

    return {
      executiveInsights: ["Telemetry unclear.", "Maintain current course."],
      recommendedActions: ["Check sensors.", "Verify data integrity."],
      userPersona: result.userPersona || "Data Analyst",
      ...result,
      groundingSources: groundingSources
    };

  } catch (error) {
    console.error("DRS Analysis Failed:", error);
    return {
      datasetName: "Unknown Signal",
      topic: "General Data",
      userPersona: "System Operator",
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
    
    TASK: Provide a concise tactical observation (max 2 sentences) and one immediate adjustment.
    Style: Professional, direct, high-performance.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  return response.text || "No tactical data available.";
};

export const askDataQuestion = async (
  question: string,
  contextData: string
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Context: ${contextData}\n\nQuestion: ${question}\n\nAnswer as a Race Strategist. Be brief.`,
    config: { tools: [{ googleSearch: {} }] }
  });
  return response.text || "No data.";
};

export const modifyDashboardWithGemini = async (
  currentLayout: DashboardElement[],
  userCommand: string,
  columnInfo: string
): Promise<DashboardElement[]> => {
  
  const prompt = `
    System: DRS (Data Reasoning System) Interface.
    User: Driver/Principal.
    Command: "${userCommand}"
    
    Task: Modify the dashboard JSON layout to execute the command.
    
    Current Layout: ${JSON.stringify(currentLayout)}
    Available Telemetry Channels (Cols): ${columnInfo}
    
    Return ONLY the updated JSON array.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { temperature: 0.2 }
  });

  try {
    return extractJson(response.text || "[]");
  } catch (e) {
    console.error("Layout update failed", e);
    return currentLayout;
  }
};
