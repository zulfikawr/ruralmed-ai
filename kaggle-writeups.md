# RuralMed AI: Bridging the Specialist Gap with Multimodal Reasoning

**Track:** Health  
**Team:** Zulfikar

---

## Project Description

RuralMed AI is a clinical decision support system that addresses medical specialist shortages in rural and underserved areas. General practitioners in remote locations frequently operate without timely access to radiologists or dermatologists, which can result in diagnostic delays or preventable patient transfers.

The application uses Gemini 3 Pro's multimodal capabilities to analyze medical images (X-rays, CT/MRI scans, dermatological photographs, retinal images) in combination with structured patient information including symptoms, vital signs, and medical history.

The system performs clinical reasoning by validating image quality, identifying visual abnormalities, and correlating findings with patient data. It generates structured assessments that include triage recommendations, differential diagnoses with supporting rationale, visual annotations of abnormalities, and clinical guidance for the attending physician.

The application was developed using Google AI Studio to demonstrate how multimodal AI models can improve diagnostic access in resource-limited healthcare settings.

_(Word count: 137)_

---

## Project Resources

🎥 **Video Demo:** [INSERT YOUR YOUTUBE/LOOM LINK HERE]  
🚀 **Try the App:** [INSERT YOUR GOOGLE AI STUDIO SHARE LINK HERE]

---

## Problem Statement

Rural healthcare facilities often lack specialist availability. Patients presenting with abnormal chest radiographs or concerning dermatological findings may face weeks-long delays for specialist consultation. Local physicians, typically general practitioners, require immediate diagnostic support to make critical decisions about patient transfers, emergency interventions, or local treatment protocols. Delayed specialist access can adversely affect patient outcomes.

---

## Solution Overview

RuralMed AI functions as a multimodal diagnostic support tool that integrates visual and textual clinical data. The system replicates aspects of specialist clinical reasoning by analyzing complete patient presentations rather than isolated data points.

### Core Capabilities

**Multimodal Data Integration**  
Processes medical images alongside structured textual patient data including demographics, symptoms, vital signs, and medical history.

**Image Quality Assessment**  
Evaluates technical image quality parameters (sharpness, exposure, positioning) before performing diagnostic analysis, reducing the risk of interpretation errors due to suboptimal imaging.

**Visual Annotation**  
Identifies and localizes abnormalities within medical images using coordinate-based bounding boxes, allowing physicians to verify AI findings against specific anatomical regions.

**Interactive Clinical Reasoning**  
Provides an interface for physicians to query the system about specific diagnostic considerations, such as excluded diagnoses or alternative interpretations.

**Report Generation**  
Creates structured clinical reports suitable for electronic or physical medical records, addressing the needs of facilities with limited digital infrastructure.

---

## Technical Implementation

The application was developed using Google AI Studio with Gemini 3 Pro Preview as the primary reasoning model.

### Architecture

The system is built as a React single-page application with Tailwind CSS for responsive layout design. Medical image processing and clinical reasoning are handled through the Google Generative AI SDK.

### Gemini 3 Pro Integration

**Multimodal Processing**  
The model processes image data and text simultaneously without requiring separate computer vision or OCR preprocessing steps. This enables unified analysis of visual and contextual clinical information.

**Structured Output Generation**  
A JSON schema constrains the model's outputs to ensure consistent formatting of triage levels, bounding box coordinates (normalized to a 0-1000 scale), and clinical findings. This approach ensures that all outputs can be reliably parsed and displayed by the user interface.

**Clinical Reasoning Synthesis**  
The system prompt requires the model to provide explicit reasoning chains linking visual findings, patient symptoms, and diagnostic conclusions. This transparency allows clinicians to evaluate the basis for AI-generated recommendations.

---

## Clinical Impact

This application addresses a documented gap in rural healthcare delivery. By providing immediate diagnostic support, the system may help physicians make more informed triage decisions, reduce unnecessary patient transfers, and improve diagnostic confidence in settings where specialist consultation is not readily available.

The system is designed as a decision support tool rather than an autonomous diagnostic system, maintaining the physician's role in clinical decision-making while augmenting their diagnostic capabilities.

---

## Acknowledgements

- Developed for the Google DeepMind Vibe Coding Hackathon
- Built with Gemini 3 Pro and Google AI Studio
