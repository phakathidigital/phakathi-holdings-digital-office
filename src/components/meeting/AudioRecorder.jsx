import React, { useState, useRef, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, CheckCircle } from "lucide-react";

export default function AudioRecorder({ onTranscriptReady }) {
  const [state, setState] = useState("idle"); // idle | recording | recorded | transcribing
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioBlobRef = useRef(null);

  useEffect(() => () => { clearInterval(timerRef.current); }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach(t => t.stop());
      };

      mr.start(1000);
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch (e) {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audioBlobRef.current = null;
    setState("idle");
    setSeconds(0);
  };

  const transcribeAudio = async () => {
    if (!audioBlobRef.current) return;
    setState("transcribing");
    try {
      // Upload the audio file
      const { file_url } = await api.integrations.Core.UploadFile({ file: audioBlobRef.current });
      // Use AI to transcribe and summarize
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `This is an audio recording from a business meeting at Phakathi Holdings. Please transcribe the content as accurately as possible. Format it as a conversation transcript with speaker labels where possible (Speaker 1:, Speaker 2:, etc.). If you cannot identify specific speakers, use numbered labels. Return the raw transcript only.`,
        file_urls: [file_url],
      });
      onTranscriptReady(typeof result === "string" ? result : JSON.stringify(result));
      setState("idle");
      discardRecording();
    } catch (e) {
      setError("Transcription failed. Please try again or paste the transcript manually.");
      setState("recorded");
    }
  };

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
        {state === "idle" && (
          <Button type="button" onClick={startRecording} variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
            <Mic className="w-4 h-4" /> Record Audio
          </Button>
        )}

        {state === "recording" && (
          <>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono font-semibold text-red-600">{fmt(seconds)}</span>
              <span className="text-xs text-gray-500">Recording...</span>
            </div>
            <Button type="button" onClick={stopRecording} size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-white">
              <Square className="w-3.5 h-3.5" /> Stop
            </Button>
          </>
        )}

        {state === "recorded" && (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <audio controls src={audioUrl} className="h-8 flex-1 min-w-0" />
            <div className="flex gap-2 shrink-0">
              <Button type="button" onClick={discardRecording} variant="outline" size="sm" className="gap-1 text-gray-500">
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </Button>
              <Button type="button" onClick={transcribeAudio} size="sm" className="gap-1.5 bg-gray-900 hover:bg-gray-700 text-white">
                <CheckCircle className="w-3.5 h-3.5" /> Use Transcript
              </Button>
            </div>
          </div>
        )}

        {state === "transcribing" && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Transcribing audio with AI...
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-gray-400">Record directly in your browser — AI will transcribe into the text field above.</p>
    </div>
  );
}