# DRS | Data Reasoning System

> **"Reduce the drag on your analysis."**

[![System Status](https://img.shields.io/website?url=https%3A%2F%2Fdrs-data-reasoning-system-783873625770.us-west1.run.app&label=System%20Status&style=flat-square)](https://drs-data-reasoning-system-783873625770.us-west1.run.app/)
[![Deployment](https://img.shields.io/badge/Deployed%20on-Google%20Cloud%20Run-4285F4?style=flat-square&logo=google-cloud)](https://cloud.google.com/run)
![Tech](https://img.shields.io/badge/React%2019-TypeScript-blue?style=flat-square)
![AI](https://img.shields.io/badge/Powered%20by-Gemini%203.0-orange?style=flat-square)

**[LAUNCH LIVE DEMO](https://drs-data-reasoning-system-783873625770.us-west1.run.app/)**

**DRS (Data Reasoning System)** is an intelligent full-stack analytics platform that moves beyond static dashboards. 

Unlike traditional BI tools that simply visualize data, DRS uses **Agentic AI** to "role-play" as a domain expert. It detects the semantic context of your data (e.g., F1 Telemetry vs. Financial Reports), adopts a professional persona (e.g., "Head of Strategy"), and generates prescriptive "Pit Stop" actions to mitigate risk.

---

## 🏎️ Core Capabilities

### 1. Role-Based Telemetry (Identity Detection)
The system performs semantic grounding on every upload.
* **Auto-Grounding:** Uses Google Search (via Gemini 3.0) to identify the real-world source of the dataset.
* **Adaptive Persona:** * If **F1 Data** is detected → System adopts **"Head of Race Strategy"** persona.
    * If **Sales Data** is detected → System adopts **"Chief Revenue Officer"** persona.

### 2. "Pit Stop" Prescriptive Analytics
* **Executive Intelligence:** Skips raw data dumping in favor of a high-level strategy briefing.
* **Action Checklists:** Generates specific "Pit Stop Actions"—tactical tasks to improve performance based on the data's specific context.

### 3. The Self-Modifying Engine
* **Dynamic Layouts:** The dashboard is not hard-coded. Users interact via natural language ("Radio to DRS"), and the system rewrites its own React state to render new visualizations instantly.
    * *User:* "Add a scatter plot of Speed vs. LapTime."
    * *System:* Generates the Recharts configuration and renders the component in real-time.

---

## 🛠️ Technical Architecture

The application was architected using **Google AI Studio** and deployed via **Google Cloud Run**.

* **Frontend:** React 19 (Vite) + TypeScript
* **Styling:** Tailwind CSS (Custom "Night Track" F1 Theme)
* **AI Layer:** Google GenAI SDK (`gemini-1.5-pro`)
* **Visualization:** Recharts (Dynamic JSON Configuration)
* **Infrastructure:** Dockerized Container running on Google Cloud Run (Serverless)

---

## 🚀 Running Locally

If you wish to develop on the DRS Engine locally:

### Prerequisites
* Node.js (v18+)
* Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/drs-react-engine.git](https://github.com/YOUR_USERNAME/drs-react-engine.git)
    cd drs-react-engine
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Credentials**
    Create a `.env` file in the root:
    ```env
    VITE_GEMINI_API_KEY=your_key_here
    ```

4.  **Ignition**
    ```bash
    npm run dev
    ```
    Access the telemetry stream at `http://localhost:5173`.

---

## 🤝 Contributing

This project demonstrates the capability of **Generative UI**—where the interface itself is fluid and AI-driven. Forks and improvements are welcome!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/NewTelemetry`)
3.  Commit your Changes (`git commit -m 'Add Tire Degradation Logic'`)
4.  Push to the Branch (`git push origin feature/NewTelemetry`)
5.  Open a Pull Request

---

*Reduce the drag on your analysis. Run DRS.*
