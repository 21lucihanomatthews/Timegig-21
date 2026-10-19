import React, { useState, useEffect } from 'react';
import { Gig, UserLocation } from '../types';
import { X, MapPin, DollarSign, Clock, Star, ShieldCheck, CheckCircle2, Loader2, Navigation, AlertCircle } from 'lucide-react';

interface GigDetailModalProps {
  gig: Gig | null;
  onClose: () => void;
  onAcceptGig: (gig: Gig) => void;
  onCompleteGig: (gigId: string) => void;
  isOwner: boolean;
}

export const GigDetailModal: React.FC<GigDetailModalProps> = ({
  gig,
  onClose,
  onAcceptGig,
  onCompleteGig,
  isOwner,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [attemptCount, setAttemptCount] = useState(1);
  const [timeoutPopup, setTimeoutPopup] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isApplying && gig?.status === 'applying') {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        // 60 seconds reached for this attempt
        if (attemptCount < 4) {
          setAttemptCount(attemptCount + 1);
          setTimeLeft(60);
        } else {
          // 4 attempts (240s total) exhausted without owner acceptance
          setIsApplying(false);
          setTimeoutPopup(true);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [isApplying, timeLeft, attemptCount, gig]);

  if (!gig) return null;

  const handleStartApply = () => {
    setIsApplying(true);
    setTimeLeft(60);
    setAttemptCount(1);
    setTimeoutPopup(false);

    // Simulate owner accepting after 15 seconds for demonstration responsiveness, or let it timeout if desired
    setTimeout(() => {
      if (isApplying) {
        onAcceptGig(gig);
        setIsApplying(false);
        // Trigger lady voice guidance
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance("Gig accepted by owner! Navigating to destination from your exact location.");
          utterance.rate = 1.0;
          utterance.pitch = 1.1;
          window.speechSynthesis.speak(utterance);
        }
      }
    }, 12000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-xs rounded-full">
              {gig.category}
            </span>
            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
              gig.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
              gig.status === 'applying' ? 'bg-amber-100 text-amber-700' :
              gig.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {gig.status.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
              {gig.title}
            </h2>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Payout</p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{gig.pay}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">Duration</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                  <Clock className="w-4 h-4 text-sky-500" /> {gig.duration}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                LOGO
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {gig.clientName} <ShieldCheck className="w-4 h-4 text-sky-500" />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {gig.clientRating} Rating
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {gig.description}
            </p>
          </div>

          {/* Timeout Popup warning */}
          {timeoutPopup && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Gig owner did not accept after 4 attempts (4 minutes). Request timed out.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            {gig.status === 'open' && !isApplying && (
              <button
                onClick={handleStartApply}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-5 h-5" /> Apply to Gig
              </button>
            )}

            {isApplying && (
              <div className="flex flex-col items-center justify-center p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 gap-3">
                {/* Circle Loading Countdown */}
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full border-4 border-sky-500/20 border-t-sky-600 animate-spin">
                  <span className="absolute text-xs font-bold text-sky-700 dark:text-sky-300 animate-none">
                    {timeLeft}s
                  </span>
                </div>
                <p className="text-xs font-bold text-sky-900 dark:text-sky-200 text-center">
                  Waiting for gig owner to accept... (Attempt {attemptCount}/4)
                </p>
                <button
                  onClick={() => setIsApplying(false)}
                  className="text-xs text-rose-600 font-semibold underline"
                >
                  Cancel Application
                </button>
              </div>
            )}

            {gig.status === 'accepted' && (
              <div className="flex flex-col gap-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <span>Gig Accepted! Lady voice is guiding you to destination.</span>
                </div>

                {isOwner ? (
                  <button
                    onClick={() => {
                      onCompleteGig(gig.id);
                      onClose();
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow transition"
                  >
                    Mark Gig Completed (Owner Only)
                  </button>
                ) : (
                  <p className="text-[10px] text-slate-400 text-center">Only gig owner can mark this gig as completed.</p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
