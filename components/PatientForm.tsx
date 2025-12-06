import React from "react";
import { PatientData } from "../types";

interface Props {
  data: PatientData;
  onChange: (data: PatientData) => void;
  disabled: boolean;
}

export const PatientForm: React.FC<Props> = ({ data, onChange, disabled }) => {
  const handleChange = (field: keyof PatientData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleVitalChange = (
    field: keyof PatientData["vitals"],
    value: string,
  ) => {
    onChange({ ...data, vitals: { ...data.vitals, [field]: value } });
  };

  // Accessible Input Styles: High contrast, large touch target, clear focus state
  const inputClasses =
    "w-full bg-white [color-scheme:light] text-slate-900 rounded-lg border border-slate-300 shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-base p-3 placeholder:text-slate-400 transition-all disabled:bg-slate-50 disabled:text-slate-400";
  const labelClasses = "block text-sm font-bold text-slate-700 mb-1.5";
  const vitalLabelClasses =
    "block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide";

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </span>
          Patient Context
        </h2>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
          Step 2
        </span>
      </div>

      <div className="space-y-5 flex-grow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses} htmlFor="age">
              Age
            </label>
            <input
              id="age"
              type="number"
              value={data.age}
              onChange={(e) => handleChange("age", e.target.value)}
              disabled={disabled}
              className={inputClasses}
              placeholder="e.g. 45"
            />
          </div>
          <div>
            <label className={labelClasses} htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              value={data.gender}
              onChange={(e) => handleChange("gender", e.target.value)}
              disabled={disabled}
              className={inputClasses}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClasses} htmlFor="symptoms">
            Symptoms & Chief Complaint
          </label>
          <textarea
            id="symptoms"
            value={data.symptoms}
            onChange={(e) => handleChange("symptoms", e.target.value)}
            disabled={disabled}
            rows={3}
            className={inputClasses}
            placeholder="Describe what the patient is feeling..."
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-800 mb-3">
            Vitals (Optional)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={vitalLabelClasses}>Temp (°C)</label>
              <input
                type="text"
                inputMode="decimal"
                value={data.vitals.temp || ""}
                onChange={(e) => handleVitalChange("temp", e.target.value)}
                disabled={disabled}
                className={inputClasses}
                placeholder="37.0"
              />
            </div>
            <div>
              <label className={vitalLabelClasses}>BP (mmHg)</label>
              <input
                type="text"
                value={data.vitals.bp || ""}
                onChange={(e) => handleVitalChange("bp", e.target.value)}
                disabled={disabled}
                className={inputClasses}
                placeholder="120/80"
              />
            </div>
            <div>
              <label className={vitalLabelClasses}>HR (bpm)</label>
              <input
                type="number"
                inputMode="numeric"
                value={data.vitals.hr || ""}
                onChange={(e) => handleVitalChange("hr", e.target.value)}
                disabled={disabled}
                className={inputClasses}
                placeholder="72"
              />
            </div>
            <div>
              <label className={vitalLabelClasses}>SpO2 (%)</label>
              <input
                type="number"
                inputMode="numeric"
                value={data.vitals.spo2 || ""}
                onChange={(e) => handleVitalChange("spo2", e.target.value)}
                disabled={disabled}
                className={inputClasses}
                placeholder="98"
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClasses} htmlFor="history">
            Medical History
          </label>
          <textarea
            id="history"
            value={data.history}
            onChange={(e) => handleChange("history", e.target.value)}
            disabled={disabled}
            rows={2}
            className={inputClasses}
            placeholder="Past conditions, allergies, medications..."
          />
        </div>
      </div>
    </div>
  );
};
