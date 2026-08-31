# RiskRadar 🛡️
## AI/NLP Engine to Detect Serious Injury & Fatality (SIF) Precursors in Oil India Limited's Safety Reports

**Smart India Hackathon (SIH) Problem Statement 26165**  
**Target Organization:** Oil India Limited (OIL — Maharatna CPSE, Upper Assam, NRL Refinery, Pipeline Division)  

---

## 🌟 Executive Summary & Problem Framing

Oil India Limited (OIL) collects thousands of Unsafe-Act / Unsafe-Condition (UA/UC), Near-Miss, and Incident observations through its HSSE reporting kiosks, mobile dropboxes, and management systems. Currently, these reports are triaged manually after periodic intervals (monthly, quarterly), which suffers from two critical flaws:

1. **Volume Blindness**: Critical latent warnings get buried in high-volume, low-severity reports (e.g. minor slips or soft-tissue strains).
2. **The Fatality Causality Disconnect**: Global research (**DEKRA Martin & Black 2015**, **EEI SIF Precursor Model**, **PMC10998882**) proves that low-severity incidents do *not* share the same root causes as fatalities. Non-fatal workplace accidents fell 51% over 15 years, while fatalities fell only 25.5%. Only **~20–25% of safety observations carry genuine SIF potential**.

**RiskRadar** is an intelligent AI/NLP platform specifically calibrated for oil and gas operations that ingests free-text safety reports, detects true SIF precursors using a deterministic hybrid architecture, maps them to the **9 IOGP Life-Saving Rules (Report 459)** & **Process Safety Fundamentals**, constructs clickable **SIF Precursor Chains**, and visualizes cross-site recurring patterns and normalized **Site Precursor Densities**.

---

## 🚀 Key Highlights & Differentiators

| Feature | Generic "ChatGPT Wrapper" Approach | **RiskRadar (Our Solution)** |
|---|---|---|
| **AI Architecture** | Prompts an LLM to guess a single risk score (black-box) | **Hybrid Deterministic**: LLM extracts structured evidence spans; a transparent 5-factor mathematical formula computes SIF risk & confidence separately |
| **Domain Safety Taxonomy** | Generic hazard keywords | **16 O&G Canonical Hazards**, 6 Energy Types, 6 Barrier Failure States, and 12 Lifecycle Activities |
| **Barrier Failure Nuance** | Conflates "not verified" with "failed" | Differentiates **`UNVERIFIED`** (the #1 maintenance SIF precursor) from `FAILED`, `BYPASSED`, `WEAK`, and `MISSING` |
| **IOGP Alignment** | Hallucinated safety tips | **RAG-Grounded IOGP 9 Life-Saving Rules (Report 459)** + Process Safety Fundamentals (PSF) multi-tagging |
| **Explainability (XAI)** | Generic bullet points | **9-Stage Bowtie Precursor Chain DAG** with bidirectional click-to-highlight verbatim sentence spans |
| **Site Risk Ranking** | Misleading raw report counts | **Normalized SIF Precursor Density** `(High + Med SIF / Total Reports × 100)` per 100 observations |
| **Investigation Studio** | None | Auto-populated **5-Whys RCA**, **Ishikawa Fishbone**, and printable **Official PDF Investigation Pack** |

---

## 🖥️ The 11 Dedicated Dashboard Screens

1. **Executive Overview (Cockpit)**: Enterprise SIF Precursor Density index, SIF vs non-SIF ratio, high-risk installation leaderboard (Duliajan, Moran, Naharkatiya, NRL Refinery), and live anomaly alerts.
2. **HSE Priority Queue**: Ranked triage inbox dynamically ordered by DEKRA SIF score, extraction certainty, and recency, with quick triage actions.
3. **Report Detail & Evidence Inspector**: Split-screen narrative with clickable highlighted evidence spans, 5-factor score radar, and verbatim sentence drawer.
4. **SIF Precursor Chain Studio (Flagship Feature)**: Full-screen interactive 9-stage Bowtie DAG linking *Activity → Hazard → Barrier → Barrier Failure → Exposure → Consequence → IOGP Rule → Pattern → Recommended Action*.
5. **IOGP Life-Saving Rules Matrix**: Radar and compliance matrix for all 9 IOGP Report 459 standardized rules + PSF dual-tagging.
6. **Precursor Patterns & Similarity Explorer**: Semantic vector cosine similarity engine answering *"Has this precursor occurred elsewhere across OIL installations?"*
7. **Site Precursor Density Benchmark**: Normalized density ranking bar charts (events per 100 reports) across Upper Assam, NRL, Rajasthan, and Trunk Pipelines.
8. **Activity Lifecycle Matrix**: SIF potential by operational lifecycle phase (Exploration, Drilling, Completion, Production, Maintenance, SIMOPS).
9. **Barrier Failure Dynamics**: James Reason's Swiss Cheese barrier slice visualization highlighting *Unverified* vs *Bypassed* vs *Failed*.
10. **Emerging Trends & Statistical Anomaly Radar**: 30/60/90-day time-series rolling volume, Poisson anomaly flags, and early warning radar.
11. **RCA & Investigation Assistant**: Interactive 5-Whys causal drill-down, Ishikawa Fishbone dimension analysis, Hierarchy of Controls, and one-click PDF export.

---

## 🧪 18 Benchmark Hard Cases (DEMO-01 to DEMO-18)

| ID | Case Category | Summary | Extracted Barrier State | Expected SIF | IOGP Rule Tag |
|---|---|---|---|---|---|
| **DEMO-01** | **Hidden SIF (Flagship)** | Positive isolation not pressure-tested before flange break | `UNVERIFIED` | **HIGH** | Energy Isolation |
| **DEMO-02** | Obvious SIF | Worker stood beneath suspended 2.5-ton manifold spool | `WEAK` | **HIGH** | Line of Fire, Mechanical Lifting |
| **DEMO-03** | Hidden SIF | Separator vessel entered without atmospheric gas testing | `MISSING` | **HIGH** | Confined Space |
| **DEMO-04** | Hidden SIF | Angle grinding 3.5m from open hydrocarbon vent stack | `MISSING` | **HIGH** | Hot Work |
| **DEMO-05** | Obvious SIF | Elevated derrick platform access via makeshift scaffold | `MISSING` | **HIGH** | Working at Height |
| **DEMO-06** | Multi-Hazard / Multi-Rule | Permit-to-work isolation points mismatched in field | `FAILED` | **HIGH** | Work Authorisation, Energy Isolation |
| **DEMO-07** | Behavioral | Mobile phone distraction while driving crew bus on lease road | `BYPASSED` | **MEDIUM** | Driving |
| **DEMO-08** | Process Safety | Separator vessel pressure alarm silenced without MOC | `BYPASSED` | **HIGH** | Bypassing Safety Controls |
| **DEMO-09** | SIMOPS Multi-Hazard | Crane lift swung over active hot-work grinding crew | `MISSING` | **HIGH** | Mechanical Lifting, Hot Work |
| **DEMO-10** | Barrier Degradation | Emergency blowdown valve handwheel loose and slipping | `DEGRADED` | **MEDIUM** | PSF Equipment Integrity |
| **DEMO-11** | Non-SIF Actual Injury | Lumbar muscle strain moving 28kg pump (First Aid) | `VERIFIED_INTACT` | **LOW** | *(None — Actual Injury ≠ SIF)* |
| **DEMO-12** | Contradiction | Isolation completed ... later unconfirmed by night shift | `UNVERIFIED` | **HIGH** | Energy Isolation |
| **DEMO-13** | Negation Trap | Crane lift with zero personnel in exclusion zone | `VERIFIED_INTACT` | **LOW** | *(None — Zero Exposure)* |
| **DEMO-14** | Ambiguous Narrative | "Safety issue observed near process area" | `UNVERIFIED` | **INSUFFICIENT** | Route to Human Review |
| **DEMO-15** | Keyword Trap | Line pressure checked and normal at 52 bar | `VERIFIED_INTACT` | **LOW** | *(None — Normal Operation)* |
| **DEMO-16** | Latent Degradation | Multi-gas detector calibration overdue by 11 days | `DEGRADED` | **MEDIUM** | Confined Space |
| **DEMO-17** | Well Control / Kick | 15-bbl mud pit gain detected, shut-in delayed for stand | `BYPASSED` | **HIGH** | Process Safety Well Control |
| **DEMO-18** | Mechanical Lifting | Heavy 12-ton hoist commenced without rigging inspection | `MISSING` | **HIGH** | Safe Mechanical Lifting |

---

## 🛠️ Technology Stack & Execution

- **Frontend**: React 18, TypeScript, TailwindCSS v4, Lucide Icons, Recharts, Canvas, jsPDF
- **Backend API**: Python 3.12, FastAPI, Pydantic v2, Uvicorn, PyYAML
- **Domain Engines**: Deterministic SIF Scoring Engine, Hybrid AI Safety Extractor, RAG IOGP Rule Mapper, Precursor Chain DAG Generator, Vector Similarity & Anomaly Engine
- **Test Suite**: Pytest (12/12 Safety-Critical Tests Passing 100%)

### Running Locally

```bash
# 1. Start the Python FastAPI Backend (Port 8000)
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload

# 2. Start the React Frontend (Port 5173 / 5175)
cd ../frontend
npm install
npm run dev

# 3. Run Automated Safety-Critical Test Suite
cd ..
pytest backend/tests/test_safety_critical.py
```

---

## 🛡️ Judge Q&A & Defense Cheat-Sheet

> **Q: "Convince me this isn't just a ChatGPT wrapper."**  
> **A:** The LLM does not decide the risk score. The LLM's role is strictly confined to extracting structured evidence spans into a schema. A separate, deterministic 5-factor mathematical scoring engine calculates SIF potential and confidence independently. Every finding is traceable to a verbatim sentence in OIL's report.

> **Q: "Why did your model flag an incident with zero injuries as High SIF, but flagged an actual injury as Low SIF?"**  
> **A:** This directly implements DEKRA's finding: actual severity ≠ potential severity. An unverified isolation valve during flange breaking with zero injuries carries lethal potential if repeated; conversely, a soft-tissue lumbar strain from manual lifting, while recordable, cannot credibly escalate into a fatality.

> **Q: "How does this prevent alert fatigue for OIL safety officers?"**  
> **A:** The priority queue filters out routine low-SIF observations and separates ambiguous reports into a dedicated "Needs Human Review" lane, so safety officers focus their immediate time on the top 20–25% of true fatal precursors.
