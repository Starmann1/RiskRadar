import React, { useState } from "react";
import { X, Mic, Square, Send } from "lucide-react";

interface VoiceIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptSubmitted: (text: string) => void;
}

export const VoiceIntakeModal: React.FC<VoiceIntakeModalProps> = ({
  isOpen,
  onClose,
  onTranscriptSubmitted
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  if (!isOpen) return null;

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTranscript("Listening... (Field operator audio stream active)");

      // Simulate realistic transcribed oilfield safety note
      setTimeout(() => {
        setTranscript(
          "Safety observation at Moran Wellpad 84 during morning shift. Contractor rigger was standing directly beneath a 3-ton mud manifold while the mobile crane was swinging the load. Exclusion zone was not demarcated with red tape. Rig supervisor immediately sounded horn and stopped the lift. No injuries occurred."
        );
        setIsRecording(false);
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const handleSend = () => {
    if (transcript) {
      onTranscriptSubmitted(transcript);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-50 px-7 py-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-100 text-rose-700">
              <Mic className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 m-0">
                Voice Safety Note & Speech-to-Text Intake
              </h3>
              <p className="text-xs text-slate-500 m-0 font-medium">
                Dictate audio observation from field radio or mobile device
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-7 space-y-5 text-sm">
          <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-slate-50 rounded-3xl border border-slate-200/90">
            <button
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-8 ring-rose-300/40 scale-110"
                  : "bg-gradient-to-tr from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white"
              }`}
            >
              {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-8 h-8" />}
            </button>
            <div className="text-center space-y-1">
              <p className="text-base font-extrabold text-slate-900 m-0">
                {isRecording ? "Transcribing Live Field Audio..." : "Click Microphone to Record Safety Note"}
              </p>
              <p className="text-xs text-slate-500 m-0 font-medium">
                Real-time Whisper Speech-to-Text model converting voice to text
              </p>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-xs uppercase tracking-wider mb-1.5">Transcribed Safety Narrative:</label>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Spoken text appears here..."
              className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-slate-900 text-sm leading-relaxed shadow-2xs font-medium"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!transcript.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit for NLP Assessment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
