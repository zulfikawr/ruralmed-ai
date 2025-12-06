import React, { useState, useRef } from "react";
import { Layout } from "./components/Layout";
import { PatientForm } from "./components/PatientForm";
import { ImageInput } from "./components/ImageInput";
import { ReportView } from "./components/ReportView";
import { ChatAssistant } from "./components/ChatAssistant";
import {
  analyzeMedicalCase,
  assessImageQuality,
  ImagePart,
  QualityCheckResult,
} from "./services/geminiService";
import { PatientData, AnalysisResult, HistoryItem } from "./types";

// Helper to convert file to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const initialPatientData: PatientData = {
  age: "",
  gender: "",
  symptoms: "",
  duration: "",
  vitals: {},
  history: "",
};

function App() {
  const [patientData, setPatientData] =
    useState<PatientData>(initialPatientData);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [qualityWarning, setQualityWarning] =
    useState<QualityCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleImagesChange = (files: File[], urls: string[]) => {
    setSelectedFiles(files);
    setImagePreviews(urls);
    setAnalysis(null);
    setError(null);
    setQualityWarning(null);
  };

  const prepareImages = async (): Promise<ImagePart[]> => {
    return Promise.all(
      selectedFiles.map(async (file) => ({
        inlineData: {
          data: await fileToBase64(file),
          mimeType: file.type,
        },
      })),
    );
  };

  const handleAnalyzeClick = async () => {
    if (selectedFiles.length === 0) {
      setError("Please upload at least one medical image.");
      return;
    }
    if (!patientData.age || !patientData.symptoms) {
      setError("Please provide at least patient age and primary symptoms.");
      return;
    }

    setLoading(true);
    setLoadingMessage("Checking image quality...");
    setLoadingProgress(20);
    setError(null);

    try {
      const imageParts = await prepareImages();
      const qualityResult = await assessImageQuality(imageParts);

      if (!qualityResult.isQualitySufficient) {
        setQualityWarning(qualityResult);
        setLoading(false);
        setLoadingProgress(0);
        return;
      }

      // If quality is good, proceed directly
      await performFullAnalysis(imageParts);
    } catch (err: any) {
      setError("Error during image check: " + err.message);
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const performFullAnalysis = async (preparedImages?: ImagePart[]) => {
    setLoading(true);
    setLoadingMessage("Analyzing clinical data...");
    setLoadingProgress(50);
    setError(null);
    setQualityWarning(null); // Clear warning if we are proceeding

    try {
      const imageParts = preparedImages || (await prepareImages());

      // Simulate progress for better UX since the API call takes time
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const result = await analyzeMedicalCase(imageParts, patientData);

      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("Finalizing report...");

      setAnalysis(result);

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        patientData: { ...patientData },
        imageUrls: [...imagePreviews],
        result: result,
      };
      setHistory((prev) => [newHistoryItem, ...prev]);

      // Smooth scroll to results on mobile/tablet
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err: any) {
      setError(
        err.message || "An error occurred during analysis. Please try again.",
      );
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setPatientData(item.patientData);
    setImagePreviews(item.imageUrls);
    setAnalysis(item.result);
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setPatientData(initialPatientData);
    setSelectedFiles([]);
    setImagePreviews([]);
    setAnalysis(null);
    setError(null);
    setQualityWarning(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout>
      {/* Chat Assistant */}
      {analysis && !loading && (
        <ChatAssistant patientData={patientData} analysisResult={analysis} />
      )}

      {/* Quality Warning Modal */}
      {qualityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-orange-600 mb-4">
              <svg
                className="w-8 h-8"
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
              <h3 className="text-xl font-bold text-slate-900">
                Image Quality Warning
              </h3>
            </div>

            <p className="text-slate-600 mb-4">
              Our checks detected potential issues that might affect the
              accuracy of the analysis:
            </p>

            <ul className="bg-orange-50 rounded-lg p-4 mb-4 space-y-2 border border-orange-100">
              {qualityWarning.issues.map((issue, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-orange-900 font-medium"
                >
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                  {issue}
                </li>
              ))}
            </ul>

            <div className="bg-blue-50 rounded-lg p-3 mb-6 text-sm text-blue-800 flex gap-2">
              <svg
                className="w-5 h-5 shrink-0 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {qualityWarning.advice}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setQualityWarning(null)}
                className="flex-1 py-3 px-4 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Retake Photo
              </button>
              <button
                onClick={() => performFullAnalysis()}
                className="flex-1 py-3 px-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-12">
        {/* Card 1: About & Intro (Full width on mobile, 8 cols on LG) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8.5 12h-3v-3h3v-3h3v3h3v3h-3v3h-3v-3z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
              RuralMed AI Assistant
            </h1>
            <p className="text-indigo-100 text-lg max-w-2xl font-light leading-relaxed">
              An AI-powered diagnostic support tool for healthcare workers in
              low-resource settings. Upload medical images and patient context
              to receive triage guidance and clinical insights.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-indigo-200">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>{" "}
                Evidence-Based
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>{" "}
                Secure & Private
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>{" "}
                Fast Analysis
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Quick History / Status (4 cols on LG) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col h-full">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center justify-between">
            Recent Cases
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {history.length}
            </span>
          </h3>
          <div className="flex-grow overflow-y-auto max-h-[160px] space-y-2 pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                No recent analysis history.
              </p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-3 group"
                >
                  <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden flex-shrink-0 relative">
                    <img
                      src={item.imageUrls[0]}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                    {item.imageUrls.length > 1 && (
                      <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] px-1">
                        +{item.imageUrls.length - 1}
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                      {item.result.triage.level}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {new Date(item.timestamp).toLocaleDateString()} •{" "}
                      {item.patientData.age}yo {item.patientData.gender}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Image Input (6 cols on LG) */}
        <div className="col-span-1 md:col-span-1 lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <ImageInput
            onImagesChange={handleImagesChange}
            disabled={loading}
            initialPreviews={imagePreviews}
          />
        </div>

        {/* Card 4: Patient Form (6 cols on LG) */}
        <div className="col-span-1 md:col-span-1 lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
          <PatientForm
            data={patientData}
            onChange={setPatientData}
            disabled={loading}
          />
        </div>

        {/* Action Bar (Full Width) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-12">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-3">
              <svg
                className="w-6 h-6 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Progress UI replaces button when loading */}
            {loading ? (
              <div className="flex-grow bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700 flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {loadingMessage}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {loadingProgress}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAnalyzeClick}
                className="flex-grow py-4 px-8 rounded-xl font-bold text-lg shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30"
              >
                <span>Generate Analysis</span>
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
            )}

            {analysis && !loading && (
              <button
                onClick={resetForm}
                className="py-4 px-8 rounded-xl font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              >
                New Case
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        {analysis && (
          <div
            ref={resultsRef}
            className="col-span-1 md:col-span-2 lg:col-span-12 animate-fade-in-up"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <ReportView
                result={analysis}
                imagePreviews={imagePreviews}
                patientData={patientData}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
