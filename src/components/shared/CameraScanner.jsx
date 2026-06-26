import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, RotateCcw, Check, Upload, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

/**
 * CameraScanner — mobile-friendly camera/upload with AI OCR extraction.
 *
 * Props:
 *   mode: "expense" | "document"
 *   onExtracted: (data: object) => void   — called with OCR-extracted fields
 *   onClose: () => void
 */
export default function CameraScanner({ mode = "expense", onExtracted, onClose }) {
  const [phase, setPhase] = useState("idle"); // idle | camera | preview | processing | done
  const [capturedImage, setCapturedImage] = useState(null); // { dataUrl, file }
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(s);
      setPhase("camera");
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      }, 100);
    } catch (e) {
      setError("Camera access denied. Please use file upload instead.");
    }
  };

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    canvas.toBlob(blob => {
      const file = new File([blob], "scan.jpg", { type: "image/jpeg" });
      setCapturedImage({ dataUrl, file });
      stopCamera();
      setPhase("preview");
    }, "image/jpeg", 0.92);
  };

  const flipCamera = async () => {
    stopCamera();
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setTimeout(startCamera, 300);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCapturedImage({ dataUrl: ev.target.result, file });
      setPhase("preview");
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async () => {
    setPhase("processing");
    try {
      // Upload image first
      const { file_url } = await base44.integrations.Core.UploadFile({ file: capturedImage.file });

      const prompt = mode === "expense"
        ? `You are extracting data from a receipt or invoice image.
Extract the following fields from the image. If a field is not visible, return null.
Return JSON with these exact keys:
- description: what was purchased (string)
- amount: total amount as a number (no currency symbol, e.g. 450.00)
- expense_date: date in YYYY-MM-DD format
- category: one of Travel, Meals, Accommodation, Office Supplies, Training, Client Entertainment, Other
- vendor: vendor or store name
- notes: any other relevant info`
        : `You are extracting data from an HR or onboarding document (ID, contract, tax form, bank details etc.).
Extract any visible personal or employment information.
Return JSON with these exact keys:
- employee_name: full name (string)
- employee_email: email address if visible (string)
- id_number: South African ID number if visible (string)
- document_type: type of document e.g. "ID Document", "Employment Contract", "Tax Form" (string)
- start_date: employment start date in YYYY-MM-DD if visible (string)
- notes: any other relevant details (string)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: mode === "expense"
            ? {
                description: { type: "string" },
                amount: { type: "number" },
                expense_date: { type: "string" },
                category: { type: "string" },
                vendor: { type: "string" },
                notes: { type: "string" },
              }
            : {
                employee_name: { type: "string" },
                employee_email: { type: "string" },
                id_number: { type: "string" },
                document_type: { type: "string" },
                start_date: { type: "string" },
                notes: { type: "string" },
              },
        },
      });

      setPhase("done");
      onExtracted({ ...result, _receipt_url: file_url, _image_dataUrl: capturedImage.dataUrl });
    } catch (e) {
      setError("OCR processing failed. Please try again or enter details manually.");
      setPhase("preview");
    }
  };

  const reset = () => {
    stopCamera();
    setCapturedImage(null);
    setPhase("idle");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-gray-900">
              {mode === "expense" ? "Scan Receipt" : "Scan Document"}
            </h3>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl text-sm text-red-700">{error}</div>
          )}

          {/* IDLE */}
          {phase === "idle" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 text-center mb-4">
                {mode === "expense"
                  ? "Take a photo of your receipt and AI will extract the amount, date, and description automatically."
                  : "Scan an onboarding document and AI will extract key employee details."}
              </p>
              <Button onClick={startCamera} className="w-full gap-2 bg-gray-900 hover:bg-gray-800 h-12 text-base">
                <Camera className="w-5 h-5" /> Open Camera
              </Button>
              <label className="w-full">
                <div className="w-full flex items-center justify-center gap-2 h-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 cursor-pointer transition-colors text-sm font-medium">
                  <Upload className="w-4 h-4" /> Upload Image or PDF
                </div>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}

          {/* CAMERA */}
          {phase === "camera" && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4/5 h-3/4 border-2 border-white/50 rounded-xl" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="flex-1 gap-1.5">
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button variant="outline" onClick={flipCamera} size="icon" className="shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button onClick={capture} className="flex-1 gap-1.5 bg-gray-900 hover:bg-gray-800">
                  <Camera className="w-4 h-4" /> Capture
                </Button>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {phase === "preview" && capturedImage && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
                <img src={capturedImage.dataUrl} alt="Captured" className="w-full h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="flex-1 gap-1.5">
                  <RotateCcw className="w-4 h-4" /> Retake
                </Button>
                <Button onClick={processOCR} className="flex-1 gap-1.5 bg-gray-900 hover:bg-gray-800">
                  <Zap className="w-4 h-4" /> Extract with AI
                </Button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {phase === "processing" && (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-7 h-7 text-gray-700 animate-spin" />
              </div>
              <p className="font-semibold text-gray-800">Analysing with AI...</p>
              <p className="text-sm text-gray-400">Extracting fields from your {mode === "expense" ? "receipt" : "document"}</p>
            </div>
          )}

          {/* DONE */}
          {phase === "done" && (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-semibold text-gray-800">Fields extracted!</p>
              <p className="text-sm text-gray-400">Review and confirm the auto-filled details in the form.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}