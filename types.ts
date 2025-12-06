export enum TriageLevel {
  EMERGENCY = "Immediate Emergency",
  URGENT = "Urgent Specialist Consult",
  ROUTINE = "Routine Follow-up",
  SELF_CARE = "Self-care / Low Risk",
}

export interface PatientData {
  age: string;
  gender: string;
  symptoms: string;
  duration: string;
  vitals: {
    temp?: string;
    bp?: string;
    hr?: string;
    spo2?: string;
  };
  history: string;
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  label: string;
  imageIndex?: number;
}

export interface Finding {
  region: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  visualPattern: string;
  box?: BoundingBox;
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: string;
  reasoning: string;
}

export interface AnalysisResult {
  imageQuality: {
    usable: boolean;
    issues: string[];
    suggestions: string[];
  };
  findings: Finding[];
  symptomAnalysis: string;
  integratedAssessment: string;
  differentialDiagnosis: DifferentialDiagnosis[];
  triage: {
    level: TriageLevel;
    justification: string;
  };
  clinicalGuidance: {
    gpActions: string[];
    patientExplanation: string;
    stabilityChecks: string[];
    nextSteps: string[];
  };
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  patientData: PatientData;
  imageUrls: string[];
  result: AnalysisResult;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}
