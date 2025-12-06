import React, { useState } from "react";
import { AnalysisResult, TriageLevel, PatientData } from "../types";

interface Props {
  result: AnalysisResult;
  imagePreviews: string[];
  patientData: PatientData;
}

export const ReportView: React.FC<Props> = ({
  result,
  imagePreviews,
  patientData,
}) => {
  const [activeTab, setActiveTab] = useState<"clinical" | "patient">(
    "clinical",
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 font-bold";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200 font-bold";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 font-medium";
      default:
        return "bg-blue-50 text-blue-700 border-blue-100 font-medium";
    }
  };

  const getTriageColor = (level: TriageLevel) => {
    switch (level) {
      case TriageLevel.EMERGENCY:
        return "bg-red-600 text-white";
      case TriageLevel.URGENT:
        return "bg-orange-500 text-white";
      case TriageLevel.ROUTINE:
        return "bg-green-500 text-white";
      case TriageLevel.SELF_CARE:
        return "bg-blue-400 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const handleExportPDF = async () => {
    // 1. Convert Blob URLs to Base64 Data URIs to ensure they render in the new window
    const base64Images = await Promise.all(
      imagePreviews.map(async (url) => {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.error("Failed to convert image for PDF", e);
          return url; // Fallback, though likely won't render
        }
      }),
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export the report.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Medical Report - RuralMed AI</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none; }
                @page { margin: 1.5cm; }
                .page-break-avoid { break-inside: avoid; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; padding: 2rem; max-width: 210mm; margin: 0 auto; color: #1e293b; }
        </style>
      </head>
      <body>
        <div class="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
            <div>
                <h1 class="text-3xl font-bold text-slate-900">RuralMed <span class="text-blue-600">AI</span> Report</h1>
                <p class="text-slate-500 mt-1">Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="text-right bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Patient Context</div>
                <div class="font-bold text-lg text-slate-900">${patientData.age} Years • ${patientData.gender}</div>
                <div class="text-sm text-slate-600 mt-1">ID: #${Date.now().toString().slice(-6)}</div>
            </div>
        </div>

        <!-- Triage Section -->
        <div class="mb-8 p-6 rounded-xl border-l-8 ${result.triage.level === TriageLevel.EMERGENCY ? "bg-red-50 border-red-600" : result.triage.level === TriageLevel.URGENT ? "bg-orange-50 border-orange-500" : result.triage.level === TriageLevel.ROUTINE ? "bg-green-50 border-green-500" : "bg-blue-50 border-blue-400"}">
            <h2 class="text-sm font-bold uppercase tracking-wider mb-2 opacity-70">Triage Recommendation</h2>
            <div class="text-3xl font-extrabold mb-2 text-slate-900">${result.triage.level}</div>
            <p class="text-slate-800 font-medium text-lg">${result.triage.justification}</p>
        </div>

        <!-- Integrated Assessment -->
        <div class="mb-8">
            <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">Clinical Assessment</h3>
            <div class="text-slate-800 leading-relaxed text-justify">
                ${result.integratedAssessment}
            </div>
             <div class="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-sm">
                <span class="font-bold text-slate-700">Reported Symptoms:</span>
                <span class="text-slate-600">${patientData.symptoms} (${patientData.duration})</span>
            </div>
        </div>

        <!-- Images Grid -->
        <div class="mb-8 page-break-avoid">
            <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Imaging</h3>
            <div class="grid grid-cols-2 gap-4">
                ${base64Images
                  .map(
                    (src, i) => `
                    <div class="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 page-break-avoid">
                        <img src="${src}" class="w-full h-48 object-contain">
                        <div class="p-2 text-xs text-center text-slate-500 font-mono border-t border-slate-200 bg-white">Scan ${i + 1}</div>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        </div>

        <!-- Findings Table -->
        <div class="mb-8 page-break-avoid">
             <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Detailed Findings</h3>
             <table class="w-full text-sm text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead class="bg-slate-100 text-slate-800 font-bold uppercase text-xs">
                    <tr>
                        <th class="p-3 border-b border-slate-200 w-1/4">Region</th>
                        <th class="p-3 border-b border-slate-200 w-1/6">Severity</th>
                        <th class="p-3 border-b border-slate-200">Description</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                    ${result.findings
                      .map(
                        (f) => `
                        <tr>
                            <td class="p-3 font-semibold text-slate-900 bg-slate-50/50">${f.region}</td>
                            <td class="p-3"><span class="px-2 py-1 rounded border text-xs font-bold ${f.severity === "Critical" ? "bg-red-50 text-red-700 border-red-100" : f.severity === "High" ? "bg-orange-50 text-orange-700 border-orange-100" : "bg-blue-50 text-blue-700 border-blue-100"}">${f.severity}</span></td>
                            <td class="p-3 text-slate-700">${f.description}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
             </table>
        </div>

        <!-- Differential -->
        <div class="mb-8 page-break-avoid">
            <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Differential Diagnosis</h3>
            <ul class="space-y-2">
                ${result.differentialDiagnosis
                  .map(
                    (d) => `
                    <li class="flex items-start gap-4 p-3 rounded-lg border border-slate-100 bg-white shadow-sm">
                        <div class="flex-1">
                            <div class="flex items-baseline justify-between mb-1">
                                <span class="font-bold text-slate-900">${d.condition}</span>
                                <span class="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">${d.probability}</span>
                            </div>
                            <p class="text-sm text-slate-600">${d.reasoning}</p>
                        </div>
                    </li>
                `,
                  )
                  .join("")}
            </ul>
        </div>

        <!-- Action Plan -->
        <div class="mb-8 page-break-avoid">
             <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">Clinical Guidance</h3>
             <div class="grid grid-cols-2 gap-6">
                 <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 class="font-bold text-slate-800 text-sm uppercase mb-3">Immediate Actions</h4>
                    <ul class="space-y-2 text-sm text-slate-700">
                        ${result.clinicalGuidance.gpActions.map((a) => `<li class="flex gap-2"><span class="text-blue-500 font-bold">•</span> ${a}</li>`).join("")}
                    </ul>
                 </div>
                 <div class="bg-white border border-slate-200 rounded-xl p-4">
                    <h4 class="font-bold text-slate-800 text-sm uppercase mb-3">Next Steps</h4>
                     <ul class="space-y-2 text-sm text-slate-700">
                        ${result.clinicalGuidance.nextSteps.map((a) => `<li class="flex gap-2"><span class="text-blue-500 font-bold">•</span> ${a}</li>`).join("")}
                    </ul>
                 </div>
             </div>
        </div>

        <div class="text-center text-xs text-slate-400 mt-12 pt-6 border-t border-slate-200">
            <p><strong>Disclaimer:</strong> This report is generated by an AI assistant (RuralMed AI) for preliminary analysis only. It must be reviewed by a qualified healthcare professional. Do not rely on this document for final diagnosis.</p>
        </div>

        <script>
            // Wait for images to render then print
            window.onload = () => { setTimeout(() => window.print(), 800); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const renderBoundingBoxes = (imgIndex: number) => {
    if (!result.findings) return null;
    return result.findings.map((f, i) => {
      if (!f.box) return null;
      const boxImageIndex =
        f.box.imageIndex !== undefined ? f.box.imageIndex : 0;
      if (boxImageIndex !== imgIndex) return null;

      const { ymin, xmin, ymax, xmax } = f.box;
      return (
        <div
          key={i}
          className="absolute border-4 border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.6)] group transition-all hover:border-red-400"
          style={{
            top: `${(ymin / 1000) * 100}%`,
            left: `${(xmin / 1000) * 100}%`,
            height: `${((ymax - ymin) / 1000) * 100}%`,
            width: `${((xmax - xmin) / 1000) * 100}%`,
          }}
        >
          <div className="absolute -top-8 left-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {f.box.label || f.region}
          </div>
        </div>
      );
    });
  };

  if (!result.imageQuality.usable) {
    return (
      <div className="p-8 bg-red-50 border-l-8 border-red-500">
        <h3 className="text-2xl font-bold text-red-800 mb-4">
          Analysis Halted: Image Quality Issue
        </h3>
        <p className="text-lg text-red-700 mb-6">
          The AI could not reliably analyze this image due to quality
          constraints.
        </p>
        <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
          <p className="font-bold text-slate-800 mb-2">Detected Issues:</p>
          <ul className="list-disc list-inside text-slate-700 mb-4 space-y-1">
            {result.imageQuality.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
          <p className="font-bold text-slate-800 mb-2">How to improve:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1">
            {result.imageQuality.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Analysis Results</h2>
          <p className="text-sm text-slate-500">
            Based on provided imaging and patient context
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition-colors text-sm shadow-sm border border-slate-200"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export Report (PDF)
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar: Visuals & Findings */}
        <div className="lg:w-1/3 bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
          {/* Triage Badge */}
          <div
            className={`rounded-xl p-5 mb-6 shadow-md ${getTriageColor(result.triage.level)}`}
          >
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">
              Triage Recommendation
            </p>
            <h2 className="text-2xl font-extrabold leading-tight">
              {result.triage.level}
            </h2>
            <p className="mt-2 text-sm font-medium opacity-90 border-t border-white/20 pt-2">
              {result.triage.justification}
            </p>
          </div>

          {/* Image Display */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Visual Analysis
              </h3>
              {imagePreviews.length > 1 && (
                <span className="text-xs font-medium text-slate-400">
                  Image {selectedImageIndex + 1} of {imagePreviews.length}
                </span>
              )}
            </div>

            {/* Main Image */}
            <div className="relative rounded-xl overflow-hidden bg-slate-200 shadow-md group w-full">
              <img
                src={imagePreviews[selectedImageIndex]}
                alt="Analyzed Medical Scan"
                className="w-full h-auto block"
              />
              {renderBoundingBoxes(selectedImageIndex)}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
                AI Overlays Active
              </div>
            </div>

            {/* Thumbnails */}
            {imagePreviews.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {imagePreviews.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? "border-blue-600 ring-2 ring-blue-200" : "border-slate-200 opacity-60 hover:opacity-100"}`}
                  >
                    <img
                      src={url}
                      alt={`Thumb ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key Findings List */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Detected Abnormalities
            </h3>
            <div className="space-y-3">
              {result.findings.length > 0 ? (
                result.findings.map((f, i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800">
                        {f.region}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(f.severity)}`}
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-snug">
                      {f.description}
                    </p>
                    {f.box?.imageIndex !== undefined &&
                      imagePreviews.length > 1 && (
                        <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          See Image {f.box.imageIndex + 1}
                        </div>
                      )}
                  </div>
                ))
              ) : (
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-slate-500 italic">
                  No specific abnormalities detected.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-2/3 bg-white">
          <div className="border-b border-slate-200 flex">
            <button
              onClick={() => setActiveTab("clinical")}
              className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === "clinical" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              Clinical Report
            </button>
            <button
              onClick={() => setActiveTab("patient")}
              className={`flex-1 py-4 text-center text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === "patient" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
            >
              Patient Explanation
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {activeTab === "clinical" ? (
              <>
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Integrated Assessment
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-base">
                    {result.integratedAssessment}
                  </p>
                  <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-600">
                      <strong>Symptom Correlation:</strong>{" "}
                      {result.symptomAnalysis}
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Differential Diagnosis
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {result.differentialDiagnosis.map((d, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-800">
                            {d.condition}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {d.probability}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{d.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">
                    Recommended Actions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-blue-800 text-sm uppercase tracking-wide mb-2">
                        GP Immediate Steps
                      </h4>
                      <ul className="space-y-2">
                        {result.clinicalGuidance.gpActions.map((action, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-blue-900"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 border-t border-blue-200">
                      <h4 className="font-semibold text-blue-800 text-sm uppercase mb-2">
                        Diagnostics & Referrals
                      </h4>
                      <ul className="space-y-2">
                        {result.clinicalGuidance.nextSteps.map((step, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-blue-900"
                          >
                            <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0"></span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="animate-fade-in">
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-6">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">
                    For the Patient
                  </h3>
                  <p className="text-indigo-800 text-lg leading-relaxed">
                    {result.clinicalGuidance.patientExplanation}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-lg">
                    Important Safety Checks
                  </h4>
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {result.clinicalGuidance.stabilityChecks.map((check, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                      >
                        <span className="text-red-500">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </span>
                        <span className="text-slate-700 font-medium">
                          {check}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
