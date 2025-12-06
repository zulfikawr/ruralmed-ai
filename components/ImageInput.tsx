import React, { useRef, useState, useEffect } from "react";

interface Props {
  onImagesChange: (files: File[], previewUrls: string[]) => void;
  disabled: boolean;
  initialPreviews?: string[] | null;
}

export const ImageInput: React.FC<Props> = ({
  onImagesChange,
  disabled,
  initialPreviews,
}) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPreviews) {
      setPreviews(initialPreviews);
    } else if (initialPreviews === null) {
      setPreviews([]);
      setFiles([]);
    }
  }, [initialPreviews]);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validFiles = Array.from(newFiles).filter((file) =>
      file.type.startsWith("image/"),
    );
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => {
      const updated = [...prev, ...validFiles];
      // Don't duplicate logic here, useEffect syncs previews but we need to fire callback
      return updated;
    });

    setPreviews((prev) => {
      const updated = [...prev, ...newPreviews];
      onImagesChange([...files, ...validFiles], updated);
      return updated;
    });
  };

  const removeImage = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    onImagesChange(newFiles, newPreviews);
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
          Medical Imaging
        </h2>
        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded">
          Step 1
        </span>
      </div>

      <div
        className={`flex-grow flex flex-col transition-all duration-200 rounded-xl ${
          isDragging
            ? "bg-blue-50 border-2 border-dashed border-blue-500 ring-4 ring-blue-100"
            : ""
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {previews.length === 0 ? (
          <div
            className={`flex-grow min-h-[250px] flex flex-col items-center justify-center gap-4 border-3 border-dashed rounded-xl p-6 transition-all ${
              isDragging ? "border-transparent" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="text-center pointer-events-none">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm mx-auto transition-colors ${isDragging ? "bg-blue-200 text-blue-700" : "bg-white text-blue-600"}`}
              >
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {isDragging ? "Drop images here" : "Add Medical Scans"}
              </h3>
              <p className="text-sm text-slate-500 mb-2">
                {isDragging
                  ? "Release to upload"
                  : "Drag & drop or select files"}
              </p>
            </div>

            {/* Supported Types Info */}
            <div className="text-center mb-4 pointer-events-none">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                Accepted Modalities
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-[280px] mx-auto">
                {[
                  "X-Ray",
                  "CT / MRI",
                  "Ultrasound",
                  "Skin Lesion",
                  "Retinal",
                  "Microscopy",
                ].map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-500 shadow-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm relative z-10">
              <button
                type="button"
                onClick={() => !disabled && cameraInputRef.current?.click()}
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => !disabled && uploadInputRef.current?.click()}
                disabled={disabled}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload Files
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div
              className={`grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 overflow-y-auto max-h-[300px] p-1 ${isDragging ? "opacity-50" : ""}`}
            >
              {previews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Scan ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {!disabled && (
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                    Image {idx + 1}
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              {!disabled && (
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs font-bold">Add Image</span>
                </button>
              )}
            </div>

            {/* Show overlay message when dragging over existing images */}
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 rounded-xl border-2 border-dashed border-blue-500 z-20 pointer-events-none">
                <div className="text-blue-700 font-bold text-lg animate-pulse">
                  Drop to Add Images
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-auto">
              <button
                type="button"
                onClick={() => !disabled && cameraInputRef.current?.click()}
                className="flex-1 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Capture
              </button>
              <button
                type="button"
                onClick={() => !disabled && uploadInputRef.current?.click()}
                className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload
              </button>
            </div>
          </div>
        )}

        {/* Hidden Inputs */}
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
