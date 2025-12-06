import { GoogleGenAI, Type, Schema, Content } from "@google/genai";
import {
  AnalysisResult,
  PatientData,
  TriageLevel,
  ChatMessage,
} from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    imageQuality: {
      type: Type.OBJECT,
      properties: {
        usable: {
          type: Type.BOOLEAN,
          description:
            "Is the image of sufficient quality for clinical assessment?",
        },
        issues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of quality issues like blur, lighting, cropping.",
        },
        suggestions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "How to retake the image properly.",
        },
      },
      required: ["usable", "issues", "suggestions"],
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          region: { type: Type.STRING, description: "Anatomical region" },
          description: {
            type: Type.STRING,
            description: "Detailed clinical finding",
          },
          severity: {
            type: Type.STRING,
            enum: ["Low", "Medium", "High", "Critical"],
          },
          visualPattern: {
            type: Type.STRING,
            description:
              "What visual cue triggered this finding (e.g., 'ground-glass opacity')",
          },
          box: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER },
              label: { type: Type.STRING },
              imageIndex: {
                type: Type.INTEGER,
                description:
                  "The index of the image (0-based) this finding corresponds to. Defaults to 0 if only one image.",
              },
            },
            description:
              "Optional bounding box coordinates [0-1000] normalized to image dimensions.",
          },
        },
        required: ["region", "description", "severity", "visualPattern"],
      },
    },
    symptomAnalysis: {
      type: Type.STRING,
      description: "Interpretation of textual symptoms and history.",
    },
    integratedAssessment: {
      type: Type.STRING,
      description: "Synthesis of image findings and clinical history.",
    },
    differentialDiagnosis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          condition: { type: Type.STRING },
          probability: {
            type: Type.STRING,
            description: "High, Medium, Low, or percentage",
          },
          reasoning: { type: Type.STRING },
        },
        required: ["condition", "probability", "reasoning"],
      },
    },
    triage: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.STRING,
          enum: [
            "Immediate Emergency",
            "Urgent Specialist Consult",
            "Routine Follow-up",
            "Self-care / Low Risk",
          ],
        },
        justification: { type: Type.STRING },
      },
      required: ["level", "justification"],
    },
    clinicalGuidance: {
      type: Type.OBJECT,
      properties: {
        gpActions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Actions for the general practitioner.",
        },
        patientExplanation: {
          type: Type.STRING,
          description: "Simple language explanation for the patient.",
        },
        stabilityChecks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Vitals to monitor.",
        },
        nextSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Tests, imaging, or referrals.",
        },
      },
      required: [
        "gpActions",
        "patientExplanation",
        "stabilityChecks",
        "nextSteps",
      ],
    },
  },
  required: [
    "imageQuality",
    "findings",
    "symptomAnalysis",
    "integratedAssessment",
    "differentialDiagnosis",
    "triage",
    "clinicalGuidance",
  ],
};

const qualitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isQualitySufficient: {
      type: Type.BOOLEAN,
      description:
        "True if the image is clear enough for medical interpretation.",
    },
    issues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of technical issues: Blur, Low Light, Bad Angle, Obstructed, Not Medical, Partial Capture.",
    },
    advice: {
      type: Type.STRING,
      description: "Brief advice on how to retake the photo.",
    },
  },
  required: ["isQualitySufficient", "issues", "advice"],
};

export interface ImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

export interface QualityCheckResult {
  isQualitySufficient: boolean;
  issues: string[];
  advice: string;
}

export const assessImageQuality = async (
  images: ImagePart[],
): Promise<QualityCheckResult> => {
  const model = "gemini-2.5-flash";
  const promptText = `
    You are a technical assistant for a medical imaging tool. 
    Analyze the provided image(s) STRICTLY for technical quality and suitability for medical diagnosis.
    
    Check for:
    1. Blur (Motion or Focus)
    2. Low Lighting / Underexposure
    3. Extreme Glare / Overexposure
    4. Bad Angle (e.g., photo of a screen taken from the side)
    5. Wrong Body Part / Not a Medical Image (e.g., a selfie, a room, a pet)
    6. Partial Capture (Critical area cut off)

    If the image has significant issues that make it unreliable for AI analysis, set isQualitySufficient to false.
    Be strict. Safety first.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [...images, { text: promptText }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: qualitySchema,
        temperature: 0.0,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI quality check");
    return JSON.parse(text) as QualityCheckResult;
  } catch (error) {
    console.warn("Quality check failed, defaulting to pass:", error);
    // Fail open to allow analysis if quality check errors out
    return { isQualitySufficient: true, issues: [], advice: "" };
  }
};

export const analyzeMedicalCase = async (
  images: ImagePart[],
  patient: PatientData,
): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";

  const promptText = `
    You are an expert Medical AI Assistant designed for rural healthcare settings. 
    Analyze the provided medical image(s) and patient context.
    
    Patient Context:
    Age: ${patient.age}
    Gender: ${patient.gender}
    Symptoms: ${patient.symptoms}
    Duration: ${patient.duration}
    Vitals: Temp ${patient.vitals.temp}, BP ${patient.vitals.bp}, HR ${patient.vitals.hr}, SpO2 ${patient.vitals.spo2}
    History: ${patient.history}

    Tasks:
    1. Validate image quality. If unusable, explain why in the 'imageQuality' section.
    2. Detect anatomical regions and abnormalities. If multiple images are provided, synthesize findings from all of them.
    3. Correlate visual findings with symptoms.
    4. Provide a differential diagnosis with reasoning.
    5. Determine triage urgency.
    6. Provide actionable clinical guidance.

    IMPORTANT: This is a decision support tool. Be conservative and prioritize safety. 
    If you detect coordinates for a specific abnormality, return them in the 'box' field normalized 0-1000. 
    If multiple images are present, specify the 'imageIndex' (0-based) in the box object.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: {
        parts: [...images, { text: promptText }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.1, // Low temperature for factual medical analysis
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const sendChatQuestion = async (
  history: ChatMessage[],
  newMessage: string,
  patient: PatientData,
  analysis: AnalysisResult,
): Promise<string> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `
    You are a professional Medical AI Assistant named "RuralMed Assistant".
    You are discussing a specific patient case with a healthcare provider.
    
    --- CURRENT PATIENT CASE ---
    Patient: ${patient.age} years old, ${patient.gender}
    Symptoms: ${patient.symptoms} (${patient.duration})
    Vitals: Temp ${patient.vitals.temp || "N/A"}, BP ${patient.vitals.bp || "N/A"}, HR ${patient.vitals.hr || "N/A"}, SpO2 ${patient.vitals.spo2 || "N/A"}
    Medical History: ${patient.history}
    
    --- AI ANALYSIS FINDINGS ---
    Triage Level: ${analysis.triage.level}
    Justification: ${analysis.triage.justification}
    Assessment: ${analysis.integratedAssessment}
    Differential Diagnosis: ${analysis.differentialDiagnosis.map((d) => `${d.condition} (${d.probability})`).join(", ")}
    Action Plan: ${analysis.clinicalGuidance.gpActions.join("; ")}
    
    --- RULES ---
    1. Answer the user's questions based strictly on the provided case context.
    2. Be concise, professional, and empathetic.
    3. Do not hallucinate new medical findings not present in the analysis or patient data.
    4. If asked about treatment, prioritize the "clinicalGuidance" from the analysis, but always remind the user to use professional judgment.
    5. This is a support tool, not a replacement for a doctor.
  `;

  try {
    // Map internal history to Gemini SDK Content format
    const chatHistory = history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chat = genAI.chats.create({
      model: model,
      history: chatHistory,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I apologize, I could not generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to the service right now. Please try again.";
  }
};
