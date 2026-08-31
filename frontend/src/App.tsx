import React, { useState, useEffect } from "react";
import { ReportItem, SIFPotentialLabel, ReviewDecision } from "./types";
import { Navbar } from "./components/Navbar";
import { SidebarNav } from "./components/SidebarNav";
import { FilterBar } from "./components/FilterBar";
import { DocumentPDFModal } from "./components/DocumentPDFModal";
import { BatchUploadModal } from "./components/BatchUploadModal";
import { VoiceIntakeModal } from "./components/VoiceIntakeModal";
import { ReviewModal } from "./components/ReviewModal";
import { InvestigationExportModal } from "./components/InvestigationExportModal";

// 11 Screens
import { Screen1_ExecutiveOverview } from "./screens/Screen1_ExecutiveOverview";
import { Screen2_PriorityQueue } from "./screens/Screen2_PriorityQueue";
import { Screen3_ReportDetail } from "./screens/Screen3_ReportDetail";
import { Screen_ReportIngestion } from "./screens/Screen_ReportIngestion";
import { Screen4_SIFChainStudio } from "./screens/Screen4_SIFChainStudio";
import { Screen5_IOGPMatrix } from "./screens/Screen5_IOGPMatrix";
import { Screen6_SimilarityExplorer } from "./screens/Screen6_SimilarityExplorer";
import { Screen7_SiteComparison } from "./screens/Screen7_SiteComparison";
import { Screen8_ActivityAnalysis } from "./screens/Screen8_ActivityAnalysis";
import { Screen9_BarrierFailures } from "./screens/Screen9_BarrierFailures";
import { Screen11_InvestigationRCA } from "./screens/Screen11_InvestigationRCA";

import { fetchReports, createReport, submitReportReview } from "./api/client";
import { buildLocalPrecursorChain } from "./data/seedReports";
import { FileText, ShieldCheck, Sparkles } from "lucide-react";

export function App() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [activeScreen, setActiveScreen] = useState<number>(1);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [sifFilter, setSifFilter] = useState("");
  const [ruleFilter, setRuleFilter] = useState("");

  // Modals
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRCAModalOpen, setIsRCAModalOpen] = useState(false);

  // Initialize dataset
  useEffect(() => {
    async function loadData() {
      const serverReports = await fetchReports();
      if (serverReports && serverReports.length > 0) {
        setReports(serverReports);
        setSelectedReport(serverReports[0]);
      } else {
        setReports([]);
        setSelectedReport(null);
      }
    }
    loadData();
  }, []);

  // Filtered reports for priority queue & searches
  const filteredReports = reports.filter((r) => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const inText = r.narrative_text.toLowerCase().includes(s);
      const inRef = r.external_ref.toLowerCase().includes(s);
      const inSite = r.site.toLowerCase().includes(s);
      if (!inText && !inRef && !inSite) return false;
    }
    if (siteFilter && r.site !== siteFilter) return false;
    if (activityFilter && r.activity !== activityFilter) return false;
    if (sifFilter && r.assessment.sif_potential_label !== sifFilter) return false;
    if (ruleFilter && !r.rule_mappings.some((m) => m.life_saving_rule === ruleFilter)) return false;
    return true;
  });

  const uniqueSites = Array.from(new Set(reports.map((r) => r.site)));
  const uniqueActivities = Array.from(new Set(reports.map((r) => r.activity))).map((act) => ({
    id: act,
    name: act.replace(/_/g, " ").toUpperCase()
  }));

  // Handle New Report Submission
  const handleCreateReport = async (formData: any) => {
    const res = await createReport(formData);
    const newReport: ReportItem = res || {
      report_id: `OIL-LIVE-${Date.now().toString().slice(-4)}`,
      external_ref: `NS-2026-${Date.now().toString().slice(-5)}`,
      title: `Live Observation - ${formData.site}`,
      report_type: formData.report_type,
      report_date: formData.report_date,
      site: formData.site,
      activity: formData.activity,
      narrative_text: formData.narrative_text,
      actual_severity: formData.actual_severity || "NONE",
      contractor_involved: formData.contractor_involved || false,
      difficulty_category: "live_ingested",
      extraction: {
        activity: formData.activity,
        activity_criticality: 2,
        hazards: [{ canonical_hazard: "stored_pressurized_energy", display_name: "Stored / Pressurized Energy", energy_type: "pressure", energy_level: 3 }],
        energy_type: "pressure",
        energy_level: 3,
        exposure: { present: true, proximity: 2, description: "Personnel in danger zone" },
        barriers: [{ canonical_barrier: "positive_energy_isolation", display_name: "Positive Energy Isolation", barrier_status: "UNVERIFIED" }],
        potential_consequence: "Uncontrolled hydrocarbon release",
        negations_detected: [],
        contradictions_detected: [],
        uncertainties: [],
        confidence: 0.94
      },
      assessment: {
        raw_score: 6.8,
        sif_potential_label: "HIGH",
        confidence: 0.94,
        routing_decision: "PRIORITY_QUEUE",
        component_scores: { exposure: 1, energy: 3, barrier: 2, proximity: 2, activity: 2 },
        process_safety_relevant: true,
        reasons: ["Exposure present", "Energy level HIGH", "Barrier UNVERIFIED"]
      },
      rule_mappings: [{
        life_saving_rule: "ENERGY_ISOLATION",
        rule_display_name: "Energy Isolation",
        is_process_safety_fundamental: true,
        confidence: 0.94,
        guidance: "Verify isolation and zero energy before work begins."
      }],
      review_status: "PENDING",
      created_at: new Date().toISOString()
    };

    newReport.precursor_chain = buildLocalPrecursorChain(newReport);
    setReports((prev) => [newReport, ...prev]);
    setSelectedReport(newReport);
    setActiveScreen(4); // Jump to SIF Precursor Chain
  };

  // Handle Review Submission
  const handleReviewSubmit = async (
    reportId: string,
    reviewerId: string,
    decision: ReviewDecision,
    reason?: string,
    correctedLabel?: SIFPotentialLabel
  ) => {
    await submitReportReview(reportId, reviewerId, decision, reason, correctedLabel);
    setReports((prev) =>
      prev.map((r) => {
        if (r.report_id === reportId) {
          return {
            ...r,
            review_status: decision,
            reviewed_by: reviewerId,
            review_decision: decision,
            review_comment: reason,
            assessment: {
              ...r.assessment,
              sif_potential_label: (decision === "EDIT" && correctedLabel) ? correctedLabel : r.assessment.sif_potential_label
            }
          };
        }
        return r;
      })
    );
  };

  const highSIFCount = reports.filter((r) => r.assessment.sif_potential_label === "HIGH").length;
  const currentReport = selectedReport || reports[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* 1. Left Side Navigation Panel */}
      <SidebarNav
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        priorityQueueCount={reports.filter((r) => r.assessment.sif_potential_label === "HIGH" && r.review_status === "PENDING").length}
        onOpenNewReportModal={() => setIsNewReportModalOpen(true)}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        totalReportsCount={reports.length}
        highSIFCount={highSIFCount}
      />

      {/* 2. Right Main Application Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <Navbar
          activeScreen={activeScreen}
        />

        {/* Global Filter Bar (Executive Overview Alone) */}
        {activeScreen === 1 && (
          <FilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            siteFilter={siteFilter}
            setSiteFilter={setSiteFilter}
            activityFilter={activityFilter}
            setActivityFilter={setActivityFilter}
            sifFilter={sifFilter}
            setSifFilter={setSifFilter}
            ruleFilter={ruleFilter}
            setRuleFilter={setRuleFilter}
            sites={uniqueSites}
            activities={uniqueActivities}
            onResetFilters={() => {
              setSearchTerm("");
              setSiteFilter("");
              setActivityFilter("");
              setSifFilter("");
              setRuleFilter("");
            }}
          />
        )}

        {/* Main Screen Body */}
        <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 sm:px-8 lg:px-10 py-8">
          {/* Screen 1: Executive Overview */}
          {activeScreen === 1 && (
            <Screen1_ExecutiveOverview
              overviewData={null}
              reports={filteredReports}
              onSelectReport={(r) => {
                setSelectedReport(r);
                setActiveScreen(12);
              }}
              onNavigateToScreen={(s) => setActiveScreen(s)}
            />
          )}

          {/* Screen 2: HSE Priority Queue */}
          {activeScreen === 2 && (
            <Screen2_PriorityQueue
              reports={filteredReports}
              onSelectReport={(r) => {
                setSelectedReport(r);
                setActiveScreen(12);
              }}
              onOpenChain={(r) => {
                setSelectedReport(r);
                setActiveScreen(4);
              }}
              onOpenReview={(r) => {
                setSelectedReport(r);
                setIsReviewModalOpen(true);
              }}
              onOpenRCA={(r) => {
                setSelectedReport(r);
                setActiveScreen(11);
              }}
            />
          )}

          {/* Screen 3: Add Safety Report & AI Ingestion */}
          {activeScreen === 3 && (
            <Screen_ReportIngestion
              onReportCreated={(newRep) => {
                setReports((prev) => [newRep, ...prev]);
                setSelectedReport(newRep);
              }}
              onNavigateToQueue={() => setActiveScreen(2)}
            />
          )}

          {/* Screen 12: Safety Report Detail (When Clicking Report) */}
          {activeScreen === 12 && (
            currentReport ? (
              <Screen3_ReportDetail
                report={currentReport}
                onBack={() => setActiveScreen(2)}
                onOpenChain={(r) => {
                  setSelectedReport(r);
                  setActiveScreen(4);
                }}
                onOpenReview={(r) => {
                  setSelectedReport(r);
                  setIsReviewModalOpen(true);
                }}
                onOpenRCA={(r) => {
                  setSelectedReport(r);
                  setActiveScreen(11);
                }}
                onSelectSimilarReport={(id) => {
                  const match = reports.find((r) => r.report_id === id);
                  if (match) setSelectedReport(match);
                }}
              />
            ) : (
              <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 m-0">No Report Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Please ingest a new safety report or select an existing one from the Priority Triage Queue.</p>
                <button
                  onClick={() => setActiveScreen(3)}
                  className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  + Ingest Safety Report
                </button>
              </div>
            )
          )}

          {/* Screen 4: SIF Precursor Chain Studio */}
          {activeScreen === 4 && (
            <Screen4_SIFChainStudio
              report={currentReport || reports[0]}
              reports={reports}
              onSelectReport={(r) => setSelectedReport(r)}
              onOpenRCAStudio={() => setActiveScreen(11)}
            />
          )}

          {/* Screen 5: IOGP Life-Saving Rules Matrix */}
          {activeScreen === 5 && (
            <Screen5_IOGPMatrix
              reports={filteredReports}
              onSelectReport={(r) => {
                setSelectedReport(r);
                setActiveScreen(12);
              }}
            />
          )}

          {/* Screen 6: Similarity & Pattern Discovery */}
          {activeScreen === 6 && (
            currentReport ? (
              <Screen6_SimilarityExplorer
                currentReport={currentReport}
                reports={reports}
                onSelectReport={(r) => {
                  setSelectedReport(r);
                  setActiveScreen(12);
                }}
              />
            ) : (
              <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 m-0">No Report Selected for Similarity Analysis</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Select a report from the Priority Queue or ingest a new one to discover semantic matches across safety observations.</p>
                <button
                  onClick={() => setActiveScreen(3)}
                  className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  + Ingest Safety Report
                </button>
              </div>
            )
          )}

          {/* Screen 7: Site Precursor Density & Cross-Site Similarity */}
          {activeScreen === 7 && (
            <Screen7_SiteComparison
              reports={reports}
              currentReport={currentReport}
              onSelectReport={(r) => {
                setSelectedReport(r);
                setActiveScreen(12);
              }}
              onSelectSiteFilter={(siteName) => {
                setSiteFilter(siteName);
                setActiveScreen(2);
              }}
            />
          )}

          {/* Screen 8: Activity Lifecycle Matrix */}
          {activeScreen === 8 && (
            <Screen8_ActivityAnalysis
              reports={reports}
              onSelectActivityFilter={(actId) => {
                setActivityFilter(actId);
                setActiveScreen(2);
              }}
            />
          )}

                    {/* Screen 9: Barrier Failure Modes */}
          {activeScreen === 9 && (
            <Screen9_BarrierFailures
              reports={reports}
              onSelectReport={(r) => {
                setSelectedReport(r);
                setActiveScreen(12);
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <DocumentPDFModal
        isOpen={isNewReportModalOpen}
        onClose={() => setIsNewReportModalOpen(false)}
        onSubmit={handleCreateReport}
        sites={uniqueSites}
        activities={uniqueActivities}
      />

      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onBatchProcessed={(count) => {
          // Trigger data reload
        }}
      />

      <VoiceIntakeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptSubmitted={(text) => {
          handleCreateReport({
            site: "Moran Oilfield Well #84",
            activity: "lifting_rigging",
            report_type: "UA",
            report_date: new Date().toISOString().split("T")[0],
            narrative_text: text,
            contractor_involved: true,
            actual_severity: "NONE"
          });
        }}
      />

      {currentReport && (
        <>
          <ReviewModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            report={currentReport}
            onSubmitReview={handleReviewSubmit}
          />

          <InvestigationExportModal
            isOpen={isRCAModalOpen}
            onClose={() => setIsRCAModalOpen(false)}
            report={currentReport}
          />
        </>
      )}
    </div>
  );
}

export default App;
