# RuralMed AI Assistant

RuralMed AI Assistant is a web-based clinical decision support tool designed for healthcare providers in rural or low-resource settings. It utilizes the Google Gemini API (specifically the `gemini-2.5-flash` model) to analyze medical imaging alongside patient symptoms and demographics to provide preliminary triage recommendations, differential diagnoses, and clinical guidance.

## Features

### 1. Multimodal Intake

- **Image Support**: Accepts uploads via drag-and-drop or direct camera capture. Supports formats suitable for X-rays, CT/MRI slices, ultrasound, skin lesions, and retinal scans.
- **Patient Context**: Structured form for inputting age, gender, chief complaints, duration of symptoms, vital signs (Temp, BP, HR, SpO2), and medical history.

### 2. Automated Quality Control

Before clinical analysis, the system performs a technical quality check on uploaded images to detect:

- Blur / Motion artifacts
- Poor lighting (underexposure/overexposure)
- Irrelevant content (non-medical images)
- Partial capture of the region of interest

### 3. AI Analysis & Triage

The system processes image data combined with text inputs to generate:

- **Triage Level**: Categorization into Emergency, Urgent, Routine, or Self-care.
- **Visual Findings**: Detection of abnormalities with bounding box overlays on the image.
- **Integrated Assessment**: A synthesis of visual findings and clinical history.
- **Differential Diagnosis**: Ranked list of potential conditions with probability estimates and reasoning.
- **Clinical Guidance**: Specific action steps for General Practitioners and stability checks.

### 4. Interactive Report

- **Visual Overlays**: Toggleable bounding boxes highlighting detected regions of concern.
- **Patient-Friendly Mode**: Simplified explanations of findings for patient communication.
- **PDF Export**: Generates a print-ready report including images, findings, and action plans for referrals.

### 5. Context-Aware Chatbot

A built-in chat interface allows users to ask follow-up questions about the specific case. The chat context includes the patient's data and the AI's analysis results to provide relevant answers.

## Technology Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 2.5 Flash via `@google/genai` SDK
- **Build/Runtime**: Standard web environment (ES Modules)

## Project Structure

```
/
├── index.html              # Entry HTML file
├── index.tsx               # React entry point
├── App.tsx                 # Main application logic and layout grid
├── types.ts                # TypeScript interfaces for PatientData, AnalysisResult, etc.
├── metadata.json           # App metadata and permissions
├── services/
│   └── geminiService.ts    # API interaction logic (Analysis, Chat, Quality Check)
└── components/
    ├── Layout.tsx          # Main page shell
    ├── PatientForm.tsx     # Input form for demographics and vitals
    ├── ImageInput.tsx      # Drag-and-drop and Camera capture component
    ├── ReportView.tsx      # Analysis results display and PDF export
    └── ChatAssistant.tsx   # Floating chat widget
```

## Setup and Installation

1.  **Environment Configuration**:
    The application requires a Google Gemini API Key. This must be available in the environment variables as `API_KEY`.

2.  **Running the Application**:
    - Ensure dependencies defined in `index.html` (importmap) are accessible.
    - The application is designed to run in a standard React environment.

## Usage Guide

1.  **Upload Imaging**: Drag and drop files or use the "Take Photo" button to capture the medical scan.
2.  **Enter Patient Details**: Fill in the patient's age, symptoms, and optional vitals in the "Patient Context" form.
3.  **Generate Analysis**: Click "Generate Analysis". The system will first check image quality, then proceed to full analysis.
4.  **Review Results**:
    - View the "Visual Analysis" card for image overlays.
    - Read the Triage Recommendation and Differential Diagnosis.
    - Switch tabs to see "Patient Explanation".
5.  **Export**: Click "Export Report (PDF)" to create a physical record.
6.  **Follow-up**: Use the "Ask Assistant" button to query specific details about the findings.

## Disclaimer

This software is a prototype for demonstration and research purposes. It provides preliminary analysis based on artificial intelligence patterns. **It is not a diagnostic tool and does not replace professional medical advice, diagnosis, or treatment.** All results must be verified by a qualified healthcare professional.
