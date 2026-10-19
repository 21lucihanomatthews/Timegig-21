import React, { useState, useRef, useEffect } from 'react';
import { X, Key, Building2, User, ShieldCheck, CheckCircle2, Globe, MapPin, Camera, Upload, Check, Plus, Trash2, Edit3, Link as LinkIcon, Briefcase, Award, AlertCircle, FileText, ImageIcon, Loader2, Navigation, CheckCircle, Lock } from 'lucide-react';
import { UserLocation, SavedIdDoc, ProfileData } from '../types';
import { savePersistentItem, getPersistentItem } from '../utils/storage';
import { TenantFullscreenModal } from './TenantFullscreenModal';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const ModalBase: React.FC<ModalBaseProps> = ({ isOpen, onClose, title, icon, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              {icon}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Slideshow images for subscription cards
const TENANT_IMAGES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop',
];

const USER_IMAGES = [
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=200&fit=crop',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=200&fit=crop',
];

export const ActivationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSaveSelfie: (selfieUrl: string) => void;
  onSaveIdDoc: (doc: SavedIdDoc) => void;
  onUnlockTenant?: (unlocked: boolean) => void;
  initialPlan?: 'tenant' | 'user' | null;
}> = ({ isOpen, onClose, onSaveSelfie, onSaveIdDoc, onUnlockTenant, initialPlan }) => {
  const [selectedPlan, setSelectedPlan] = useState<'tenant' | 'user' | null>(initialPlan || null);
  const [step, setStep] = useState<'select' | 'verify' | 'submitted'>('select');

  useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [initialPlan, isOpen]);
  
  // Slideshow indices
  const [tenantImgIdx, setTenantImgIdx] = useState(0);
  const [userImgIdx, setUserImgIdx] = useState(0);

  // Camera & selfie state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [idFileMeta, setIdFileMeta] = useState<SavedIdDoc | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  // Auto slideshow effect
  useEffect(() => {
    const tInterval = setInterval(() => {
      setTenantImgIdx((prev) => (prev + 1) % TENANT_IMAGES.length);
    }, 3000);
    const uInterval = setInterval(() => {
      setUserImgIdx((prev) => (prev + 1) % USER_IMAGES.length);
    }, 3000);
    return () => {
      clearInterval(tInterval);
      clearInterval(uInterval);
    };
  }, []);

  // Restore remembered selfie and ID document from persistent storage
  useEffect(() => {
    async function loadRememberedData() {
      try {
        const savedSelfie = await getPersistentItem<string>('user_selfie');
        if (savedSelfie) {
          setSelfieDataUrl(savedSelfie);
          onSaveSelfie(savedSelfie);
        }
        const savedDoc = await getPersistentItem<SavedIdDoc>('id_document');
        if (savedDoc) {
          setIdFileMeta(savedDoc);
          onSaveIdDoc(savedDoc);
        }
      } catch (err) {
        console.warn('Error restoring persistent documents:', err);
      }
    }
    if (isOpen) {
      loadRememberedData();
    }
  }, [isOpen]);

  // Ensure camera stream is stopped when modal closes or unmounts
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Handle live camera access with navigator.mediaDevices.getUserMedia
  const startCamera = async () => {
    if (cameraBlocked) {
      return;
    }

    setCameraError(null);

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setCameraBlocked(true);
      setCameraError('Camera access requires a secure context (HTTPS). Please use "Upload Photo" below.');
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraBlocked(true);
      setCameraError('Media devices camera API is not supported in this browser. Please use "Upload Photo" below.');
      return;
    }

    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video element play() error:', playErr);
        }
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      stopCamera();

      const isIframe = typeof window !== 'undefined' && window.self !== window.top;

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setCameraBlocked(true);
        if (isIframe) {
          setCameraError(
            'Camera permission was denied or restricted by the browser preview iframe permissions policy. Please use the "Upload Photo" option below to select your selfie from your device.'
          );
        } else {
          setCameraError(
            'Camera permission was denied. Please allow camera access in your browser settings, or use the "Upload Photo" option below.'
          );
        }
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setCameraBlocked(true);
        setCameraError('No front-facing camera was found on this device. Please use "Upload Photo" below.');
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another app or browser tab. Please close other apps or use "Upload Photo".');
      } else {
        setCameraError(
          `Unable to access camera: ${err?.message || 'Permission denied'}. Please use "Upload Photo" to select from your Gallery or Files.`
        );
      }
    }
  };

  const captureSelfie = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelfieDataUrl(dataUrl);
        onSaveSelfie(dataUrl);
        savePersistentItem('user_selfie', dataUrl);
        setCameraError(null);
      }
      stopCamera();
    }
  };

  // Validate that both face photo and ID document are selected before allowing submission
  const canSubmit = Boolean(selfieDataUrl && idFileMeta);

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      alert('Please provide both your face picture (selfie) and your ID document before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          selfieUrl: selfieDataUrl,
          idFileName: idFileMeta?.name || 'id_document',
          idFileSize: idFileMeta?.size || 0,
          idFileType: idFileMeta?.type || '',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit verification');
      }

      if (selectedPlan === 'tenant') {
        onUnlockTenant?.(true);
        savePersistentItem('is_tenant_unlocked', true);
        savePersistentItem('user_subscription_plan', 'tenant');
      } else {
        onUnlockTenant?.(false);
        savePersistentItem('is_tenant_unlocked', false);
        savePersistentItem('user_subscription_plan', 'user');
      }

      setStep('submitted');
    } catch (err: any) {
      console.error('Verification submit error:', err);
      setSubmitError(err.message || 'Verification submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={handleModalClose} title="System Activation & Verification" icon={<Key className="w-5 h-5" />}>
      {step === 'select' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose your subscription option (Select 1 credit card option):
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Become a Tenant Card with Slideshow */}
            <div
              onClick={() => setSelectedPlan('tenant')}
              className={`relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden flex flex-col justify-between h-52 ${
                selectedPlan === 'tenant'
                  ? 'border-sky-500 shadow-xl ring-2 ring-sky-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Slideshow Background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={TENANT_IMAGES[tenantImgIdx]}
                  alt="Tenant Workspace"
                  className="w-full h-full object-cover transition-opacity duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent"></div>
              </div>

              <div className="relative z-10 p-4 flex items-center justify-between">
                <Building2 className="w-6 h-6 text-white drop-shadow" />
                <span className="bg-sky-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">
                  R299.99/mo
                </span>
                {selectedPlan === 'tenant' && (
                  <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="relative z-10 p-4 text-white">
                <h4 className="text-sm font-bold drop-shadow">Become a Tenant</h4>
                <p className="text-[10px] text-slate-200 drop-shadow mt-0.5 leading-relaxed">
                  Earn a passive monthly income from user subscriptions. Active account fee: R299.99/mo.
                </p>
              </div>
            </div>

            {/* User Subscription Card with Slideshow */}
            <div
              onClick={() => setSelectedPlan('user')}
              className={`relative cursor-pointer rounded-2xl border-2 transition-all overflow-hidden flex flex-col justify-between h-52 ${
                selectedPlan === 'user'
                  ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              {/* Slideshow Background */}
              <div className="absolute inset-0 z-0">
                <img
                  src={USER_IMAGES[userImgIdx]}
                  alt="User Subscription"
                  className="w-full h-full object-cover transition-opacity duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent"></div>
              </div>

              <div className="relative z-10 p-4 flex items-center justify-between">
                <User className="w-6 h-6 text-white drop-shadow" />
                <span className="bg-indigo-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">
                  R29.99/mo
                </span>
                {selectedPlan === 'user' && (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              <div className="relative z-10 p-4 text-white">
                <h4 className="text-sm font-bold drop-shadow">User Subscription</h4>
                <p className="text-[10px] text-slate-200 drop-shadow mt-0.5 leading-relaxed">
                  Use the app to find and perform local gigs. Active account fee: R29.99/mo.
                </p>
              </div>
            </div>

          </div>

          <button
            disabled={!selectedPlan}
            onClick={() => {
              if (selectedPlan === 'tenant') {
                onUnlockTenant?.(true);
                savePersistentItem('is_tenant_unlocked', true);
                savePersistentItem('user_subscription_plan', 'tenant');
              } else {
                onUnlockTenant?.(false);
                savePersistentItem('is_tenant_unlocked', false);
                savePersistentItem('user_subscription_plan', 'user');
              }
              setStep('verify');
            }}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-xl transition disabled:opacity-40 mt-2"
          >
            Continue to Identity Verification
          </button>
        </div>
      )}

      {step === 'verify' && (
        <form onSubmit={handleSubmitVerification} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Selected: {selectedPlan === 'tenant' ? 'Become a Tenant (R299.99/mo)' : 'User Subscription (R29.99/mo)'}
            </span>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setStep('select');
              }}
              className="text-xs text-sky-600 underline font-semibold"
            >
              Change
            </button>
          </div>

          {/* Selfie / Face Picture Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-500" /> Face Picture / Live Selfie (Required)
              </label>
              {selfieDataUrl && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Remembered & Verified
                </span>
              )}
            </div>

            {/* Error / Blocked Explanation Notice */}
            {cameraError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold">{cameraError}</p>
                  <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                    Tip: Click <strong>"Upload Photo"</strong> below to select a clear face picture directly from your Gallery or Files app.
                  </p>
                </div>
              </div>
            )}

            {/* Live Camera View */}
            {cameraActive ? (
              <div className="flex flex-col items-center gap-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 rounded-xl object-cover bg-black"
                />
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={captureSelfie}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" /> Capture Selfie
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selfieDataUrl ? (
              /* Captured / Uploaded Photo Preview */
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <img src={selfieDataUrl} alt="Selfie Preview" className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Face Photo Verified</span>
                    <span className="text-[10px] text-emerald-600 font-medium">Saved in secure app profile</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelfieDataUrl(null);
                      setCameraError(null);
                    }}
                    className="text-xs text-rose-500 hover:underline font-semibold"
                  >
                    Change
                  </button>
                  {!cameraBlocked && (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-xs text-sky-600 hover:underline font-semibold"
                    >
                      Retake
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Capture / Upload Options */
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={cameraBlocked}
                  className={`flex-1 py-2.5 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition ${
                    cameraBlocked
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-500 hover:bg-sky-600 text-white'
                  }`}
                  title={cameraBlocked ? 'Camera access is blocked in this environment' : 'Open front camera'}
                >
                  <Camera className="w-4 h-4" />
                  {cameraBlocked ? 'Camera Blocked' : 'Capture Live Selfie'}
                </button>

                {/* Upload Photo: Opens Android Gallery / Files picker (no capture="user") */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="flex-1 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl shadow flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Upload className="w-4 h-4 text-slate-400" /> Upload Photo
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const res = ev.target?.result as string;
                        if (res) {
                          setSelfieDataUrl(res);
                          onSaveSelfie(res);
                          savePersistentItem('user_selfie', res);
                          setCameraError(null);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* ID Document Upload Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" /> Upload ID Document (Required: PDF, JPG, PNG)
              </label>
              {idFileMeta && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Remembered
                </span>
              )}
            </div>

            {/* ID File Picker Trigger */}
            <div
              onClick={() => idInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-white dark:bg-slate-900"
            >
              {idFileMeta ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 shrink-0">
                    {idFileMeta.type.includes('pdf') ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{idFileMeta.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {(idFileMeta.size / 1024).toFixed(1)} KB • {idFileMeta.type.replace('application/', '').replace('image/', '').toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs text-sky-600 font-bold hover:underline shrink-0">Change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Click to select ID document from device (Gallery or Files)
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Supports PDF, JPG, PNG files</span>
                </div>
              )}
            </div>

            <input
              ref={idInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png,image/jpg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  const docMeta: SavedIdDoc = {
                    name: file.name,
                    size: file.size,
                    type: file.type || 'application/octet-stream',
                    uploadedAt: new Date().toISOString(),
                  };
                  setIdFileMeta(docMeta);
                  onSaveIdDoc(docMeta);
                  savePersistentItem('id_document', docMeta);
                }
              }}
            />
          </div>

          {/* Submission Feedback & Validation Notice */}
          {!canSubmit && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center">
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                * Please provide both your <strong>Face Picture</strong> and your <strong>ID Document</strong> to activate verification.
              </p>
            </div>
          )}

          {submitError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-center">
              <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">{submitError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xl transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Verification...
              </>
            ) : (
              'Submit Verification'
            )}
          </button>
        </form>
      )}

      {step === 'submitted' && (
        <div className="flex flex-col items-center text-center py-6 gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl font-bold shadow-lg">
            ✓
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Submission Received!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Your verification documents and face picture have been successfully submitted and saved in your account. Review takes about 15 to 25 minutes.
            </p>
          </div>
          <button
            onClick={() => {
              setStep('select');
              handleModalClose();
            }}
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-2xl shadow transition mt-2"
          >
            Done
          </button>
        </div>
      )}
    </ModalBase>
  );
};

export const TenantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  return <TenantFullscreenModal isOpen={isOpen} onClose={onClose} />;
};

export const LockedTenantModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGoToActivation: () => void;
  onUnlockTenant?: () => void;
}> = ({ isOpen, onClose, onGoToActivation, onUnlockTenant }) => {
  if (!isOpen) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Tenant Workspace (Locked)" icon={<Lock className="w-5 h-5 text-amber-500" />}>
      <div className="flex flex-col items-center text-center py-4 gap-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 shadow-md">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tenant Workspace is Locked</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            The Tenant Workspace is exclusively unlocked when you choose <strong>"Become a Tenant"</strong> (R299.99/mo). Unlock this feature to receive your referral code, share it to social media, manage referred users, and earn passive monthly income from user subscriptions.
          </p>
        </div>
        <div className="w-full flex flex-col gap-2.5 mt-2">
          {onUnlockTenant && (
            <button
              onClick={() => {
                onUnlockTenant();
                onClose();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-sky-600 hover:from-amber-600 hover:to-sky-700 text-white font-bold text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" /> Choose Become a Tenant (Unlock & Open)
            </button>
          )}
          <button
            onClick={() => {
              onClose();
              onGoToActivation();
            }}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-2xl transition flex items-center justify-center gap-2"
          >
            Go to Activation & Identity Verification
          </button>
          <button
            onClick={onClose}
            className="py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export const PRESET_TRADES = [
  // Domestic, House Cleaning & Home Care
  'House Cleaning & Maid Services',
  'Deep Cleaner & Spring Cleaning',
  'Laundry & Ironing Assistant',
  'Carpet & Upholstery Cleaner',
  'Window & Glass Cleaner',
  'Dishwasher & Kitchen Cleaning Assistant',
  'Home Organizer & Decluttering Assistant',
  
  // Gardening, Lawn & Outdoor Maintenance
  'Gardener & Lawn Mowing',
  'Weeding, Yard Clearing & Bush Trimming',
  'Pool Cleaning & Maintenance',
  'Tree Feller & Branch Trimmer',
  'Garden Waste & Rubbish Refuse Removal',
  'General Outdoor Labourer & Digger',
  
  // General Casual Labour & Errands
  'Mover & Heavy Lifting Assistant',
  'Furniture Porter & Truck Loading Helper',
  'Personal Shopper & Errand Runner',
  'Flyer Distributor & Brand Promoter',
  'House Sitter & Property Checker',
  'Warehouse Packer & Sorter',
  
  // Maintenance, Handyman & Casual Repairs
  'Handyman & Home Maintenance',
  'Painter & Wall Decorator',
  'Carpenter & Furniture Assembly (Flat-pack)',
  'Plumber & Tap / Pipe Repairs',
  'Electrician & Light / Wiring Technician',
  'Paving, Bricklaying & Kerb Assistant',
  'Tiler & Grout Repairer',
  'Roof & Gutter Cleaner / Leak Sealer',
  'Locksmith & Door Alignment Handyman',
  'Gate, Fence & Metal Welding Repair',
  
  // Family, Childcare & Pet Care
  'Babysitter & Childcare / Nanny',
  'Dog Walker & Pet Sitting',
  'Cat Sitter & In-Home Pet Feeder',
  'Elder Companion & Care Assistant',
  'Tutor & Homework Assistant',
  
  // Delivery, Logistics & Transport
  'Express Courier & Package Delivery',
  'Food & Takeaway Delivery Courier',
  'Car Washer & Mobile Auto Detailing',
  'Bicycle Mechanic & Bike Tune-up',
  'Tyre Puncture & Fitting Assistant',
  
  // Food, Cooking, Events & Hospitality
  'Event Waiter & Catering Assistant',
  'Event Bartender & Drinks Server',
  'Braai Master, BBQ & Private Cook',
  'Home Baker & Pastry Assistant',
  'Event Setup, Tent & Stage Crew',
  'Mobile DJ & Sound System Operator',
  
  // Beauty, Hair, Grooming & Styling
  'Hairdresser & Barber / Mobile Braiding',
  'Makeup Artist & Nail Technician',
  'Manicure & Pedicure Specialist',
  'Tailor, Seamstress & Clothing Alterations',
  'Shoe Repairer & Sneaker Restorer',
  
  // Tech, Creative & Casual Admin
  'Tech & Smart Home Setup Helper',
  'Phone / Laptop Repair & Diagnostics',
  'Data Entry & Typing Assistant',
  'Casual Event Photographer & Video Recorder',
  'Drone Aerial Photography & Video',
];

export const ProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  selfieUrl: string | null;
  savedIdDoc: SavedIdDoc | null;
}> = ({ isOpen, onClose, userLocation, selfieUrl, savedIdDoc }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);

  const [profile, setProfile] = useState<ProfileData>({
    firstName: 'Alex',
    surname: 'Rivera',
    fullName: 'Alex Rivera',
    idNumber: '9204125890081',
    location: userLocation.address || 'Sandton, Johannesburg',
    contactNumber: '+27 82 555 0199',
    email: 'alex.rivera@gigspot.co.za',
    socialLinks: ['https://linkedin.com/in/alexrivera'],
    trade: 'House Cleaning & Maid Services',
    experiences: ['Residential Cleaning Specialist at Spotless Home (2 years)'],
    references: ['David Miller (Manager) - 082 333 4455'],
  });

  const [isCustomTrade, setIsCustomTrade] = useState(false);
  const [customTradeText, setCustomTradeText] = useState('');
  const [newSocial, setNewSocial] = useState('');
  const [newExp, setNewExp] = useState('');
  const [newRef, setNewRef] = useState('');

  // Load remembered profile data from persistent storage
  useEffect(() => {
    async function loadSavedProfile() {
      try {
        const saved = await getPersistentItem<ProfileData>('user_profile');
        if (saved) {
          // Ensure firstName and surname are populated if previously only fullName was stored
          const parts = saved.fullName ? saved.fullName.split(' ') : ['Alex', 'Rivera'];
          const first = saved.firstName || parts[0] || '';
          const last = saved.surname || parts.slice(1).join(' ') || '';
          
          let tradeVal = saved.trade || 'House Cleaning & Maid Services';
          let custom = false;
          let customTxt = '';

          if (tradeVal && !PRESET_TRADES.includes(tradeVal)) {
            custom = true;
            customTxt = tradeVal;
            tradeVal = 'Other / Custom Casual Trade';
          }

          setProfile({
            ...saved,
            firstName: first,
            surname: last,
            fullName: `${first} ${last}`.trim(),
            trade: tradeVal,
          });
          setIsCustomTrade(custom);
          setCustomTradeText(customTxt);

          if (saved.isLocked) {
            setIsLocked(true);
            setSaveSuccessBanner(true);
          }
        } else if (userLocation.address) {
          setProfile((prev) => ({ ...prev, location: userLocation.address || prev.location }));
        }
      } catch (err) {
        console.warn('Error loading saved profile:', err);
      }
    }
    if (isOpen) {
      loadSavedProfile();
    }
  }, [isOpen, userLocation.address]);

  // Set user location automatically via GPS and reverse geocoding
  const handleAutoSetLocation = async () => {
    setIsDetectingLocation(true);
    setValidationErrors((prev) => prev.filter((e) => e !== 'Location'));
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              const data = await res.json();
              const formattedAddress = data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)} (Exact GPS)`;
              setProfile((prev) => ({ ...prev, location: formattedAddress }));
            } catch {
              setProfile((prev) => ({ ...prev, location: `${lat.toFixed(4)}, ${lng.toFixed(4)} (GPS Location)` }));
            } finally {
              setIsDetectingLocation(false);
            }
          },
          (err) => {
            console.warn('GPS location error:', err);
            if (userLocation.address) {
              setProfile((prev) => ({ ...prev, location: userLocation.address || prev.location }));
            } else {
              setProfile((prev) => ({ ...prev, location: `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)} (GPS Live)` }));
            }
            setIsDetectingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else if (userLocation.address) {
        setProfile((prev) => ({ ...prev, location: userLocation.address || prev.location }));
        setIsDetectingLocation(false);
      }
    } catch {
      setIsDetectingLocation(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Validation: name and surname
    if (!profile.firstName?.trim()) errors.push('First Name');
    if (!profile.surname?.trim()) errors.push('Surname');

    // Validation: ID number
    if (!profile.idNumber?.trim()) errors.push('ID / Passport Number');

    // Validation: location
    if (!profile.location?.trim()) errors.push('Location');

    // Validation: contact number
    if (!profile.contactNumber?.trim()) errors.push('Contact Phone Number');

    // Validation: email address & format
    if (!profile.email?.trim()) {
      errors.push('Email Address');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      errors.push('Valid Email Address format (e.g. name@example.com)');
    }

    // Validation: Custom trade description if selected
    if (isCustomTrade && !customTradeText.trim()) {
      errors.push('Custom Casual Trade Specification');
    }

    // Validation: work experiences (at least 1 required)
    const validExperiences = profile.experiences.filter((exp) => exp.trim().length > 0);
    if (validExperiences.length < 1) {
      errors.push('At least 1 Work Experience');
    }

    // Validation: references (at least 1 required)
    const validReferences = profile.references.filter((ref) => ref.trim().length > 0);
    if (validReferences.length < 1) {
      errors.push('At least 1 Reference');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSaveSuccessBanner(false);
      return;
    }

    setValidationErrors([]);
    setIsLocked(true);
    setSaveSuccessBanner(true);

    const finalTrade = isCustomTrade && customTradeText.trim() ? customTradeText.trim() : profile.trade;

    const toSave: ProfileData = {
      ...profile,
      trade: finalTrade,
      fullName: `${profile.firstName.trim()} ${profile.surname.trim()}`,
      experiences: validExperiences,
      references: validReferences,
      isLocked: true,
    };
    await savePersistentItem('user_profile', toSave);
    alert('Profile saved and remembered! All details are securely locked and can be edited anytime.');
  };

  const handleUnlockEdit = async () => {
    setIsLocked(false);
    setSaveSuccessBanner(false);
    const toSave: ProfileData = { ...profile, isLocked: false };
    await savePersistentItem('user_profile', toSave);
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="User Profile & Professional Credentials" icon={<User className="w-5 h-5" />}>
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        
        {/* Header Profile Photo & Status */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <img
              src={selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'}
              alt="User Selfie"
              className="w-14 h-14 rounded-2xl object-cover shadow-md ring-2 ring-sky-500"
            />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                {profile.firstName || profile.surname ? `${profile.firstName} ${profile.surname}`.trim() : profile.fullName} <ShieldCheck className="w-4 h-4 text-sky-500" />
              </p>
              <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-0.5">
                <Briefcase className="w-3 h-3 text-sky-500" />
                {isCustomTrade && customTradeText.trim() ? customTradeText : profile.trade}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {selfieUrl ? 'Remembered & Selfie Verified' : 'Approved Verification'}
              </p>
            </div>
          </div>
          {isLocked && (
            <button
              type="button"
              onClick={handleUnlockEdit}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>

        {/* Saved & Locked Confirmation Notice */}
        {saveSuccessBanner && isLocked && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile details securely locked & remembered. Click <strong>"Edit Profile"</strong> anytime to update.</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
              Locked
            </span>
          </div>
        )}

        {/* Remembered ID Document Banner if available */}
        {savedIdDoc && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{savedIdDoc.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Remembered ID Document • {(savedIdDoc.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full shrink-0">
              Verified
            </span>
          </div>
        )}

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Please complete all required fields:</p>
              <ul className="list-disc list-inside mt-1 text-[11px] text-rose-700 dark:text-rose-300">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Personal & Contact Information */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Personal Information</h3>
            <span className="text-[10px] text-rose-500 font-semibold">* All fields required</span>
          </div>
          
          {/* Name & Surname Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="e.g. Alex"
                value={profile.firstName}
                onChange={(e) => {
                  setProfile({
                    ...profile,
                    firstName: e.target.value,
                    fullName: `${e.target.value} ${profile.surname}`.trim(),
                  });
                  setValidationErrors((prev) => prev.filter((item) => item !== 'First Name'));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                  validationErrors.includes('First Name') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Surname <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="e.g. Rivera"
                value={profile.surname}
                onChange={(e) => {
                  setProfile({
                    ...profile,
                    surname: e.target.value,
                    fullName: `${profile.firstName} ${e.target.value}`.trim(),
                  });
                  setValidationErrors((prev) => prev.filter((item) => item !== 'Surname'));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                  validationErrors.includes('Surname') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ID / Passport Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={isLocked}
              placeholder="e.g. 9204125890081 or Passport A1234567"
              value={profile.idNumber}
              onChange={(e) => {
                setProfile({ ...profile, idNumber: e.target.value });
                setValidationErrors((prev) => prev.filter((item) => item !== 'ID / Passport Number'));
              }}
              className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                validationErrors.includes('ID / Passport Number') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
          </div>

          {/* Contact Phone & Email Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="e.g. +27 82 555 0199"
                value={profile.contactNumber}
                onChange={(e) => {
                  setProfile({ ...profile, contactNumber: e.target.value });
                  setValidationErrors((prev) => prev.filter((item) => item !== 'Contact Phone Number'));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                  validationErrors.includes('Contact Phone Number') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                disabled={isLocked}
                placeholder="e.g. yourname@example.com"
                value={profile.email}
                onChange={(e) => {
                  setProfile({ ...profile, email: e.target.value });
                  setValidationErrors((prev) => prev.filter((item) => item !== 'Email Address'));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                  validationErrors.includes('Email Address') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          </div>

          {/* Location field with Auto GPS detection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Location (Manual or Auto GPS) <span className="text-rose-500">*</span>
              </label>
              {!isLocked && (
                <button
                  type="button"
                  onClick={handleAutoSetLocation}
                  disabled={isDetectingLocation}
                  className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Detecting GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3 h-3 text-sky-500" /> Auto-Fill Current Location
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                disabled={isLocked}
                placeholder="Click 'Auto-Fill Current Location' or type address..."
                value={profile.location}
                onChange={(e) => {
                  setProfile({ ...profile, location: e.target.value });
                  setValidationErrors((prev) => prev.filter((item) => item !== 'Location'));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 pr-8 ${
                  validationErrors.includes('Location') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              <MapPin className="absolute right-2.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Trade & Profession Selection with Simple Casual Trades */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trade & Profession</h3>
            <span className="text-[10px] text-sky-600 font-semibold">Select your main casual skill</span>
          </div>
          <select
            disabled={isLocked}
            value={profile.trade}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'Other / Custom Casual Trade') {
                setIsCustomTrade(true);
                setProfile({ ...profile, trade: val });
              } else {
                setIsCustomTrade(false);
                setProfile({ ...profile, trade: val });
                setValidationErrors((prev) => prev.filter((item) => item !== 'Custom Casual Trade Specification'));
              }
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70"
          >
            {/* Domestic, House Cleaning & Home Care */}
            <optgroup label="Domestic, Cleaning & Home Care">
              <option value="House Cleaning & Maid Services">🧹 House Cleaning & Maid Services</option>
              <option value="Deep Cleaner & Spring Cleaning">🧼 Deep Cleaner & Spring Cleaning</option>
              <option value="Laundry & Ironing Assistant">🧺 Laundry & Ironing Assistant</option>
              <option value="Carpet & Upholstery Cleaner">🧽 Carpet & Upholstery Cleaner</option>
              <option value="Window & Glass Cleaner">🪟 Window & Glass Cleaner</option>
              <option value="Dishwasher & Kitchen Cleaning Assistant">🍽️ Dishwasher & Kitchen Cleaning Assistant</option>
              <option value="Home Organizer & Decluttering Assistant">📦 Home Organizer & Decluttering Assistant</option>
            </optgroup>

            {/* Gardening, Lawn & Outdoor Maintenance */}
            <optgroup label="Gardening, Lawn & Outdoor Maintenance">
              <option value="Gardener & Lawn Mowing">🌱 Gardener & Lawn Mowing</option>
              <option value="Weeding, Yard Clearing & Bush Trimming">🌿 Weeding, Yard Clearing & Bush Trimming</option>
              <option value="Pool Cleaning & Maintenance">🏊 Pool Cleaning & Maintenance</option>
              <option value="Tree Feller & Branch Trimmer">🪓 Tree Feller & Branch Trimmer</option>
              <option value="Garden Waste & Rubbish Refuse Removal">🗑️ Garden Waste & Rubbish Refuse Removal</option>
              <option value="General Outdoor Labourer & Digger">🚜 General Outdoor Labourer & Digger</option>
            </optgroup>

            {/* General Casual Labour & Errands */}
            <optgroup label="General Casual Labour & Errands">
              <option value="Mover & Heavy Lifting Assistant">📦 Mover & Heavy Lifting Assistant</option>
              <option value="Furniture Porter & Truck Loading Helper">🚚 Furniture Porter & Truck Loading Helper</option>
              <option value="Personal Shopper & Errand Runner">🛒 Personal Shopper & Errand Runner</option>
              <option value="Flyer Distributor & Brand Promoter">📋 Flyer Distributor & Brand Promoter</option>
              <option value="House Sitter & Property Checker">🏠 House Sitter & Property Checker</option>
              <option value="Warehouse Packer & Sorter">🏷️ Warehouse Packer & Sorter</option>
            </optgroup>

            {/* Maintenance, Handyman & Casual Repairs */}
            <optgroup label="Maintenance, Handyman & Casual Repairs">
              <option value="Handyman & Home Maintenance">🔨 Handyman & Home Maintenance</option>
              <option value="Painter & Wall Decorator">🎨 Painter & Wall Decorator</option>
              <option value="Carpenter & Furniture Assembly (Flat-pack)">🪑 Carpenter & Furniture Assembly (Flat-pack)</option>
              <option value="Plumber & Tap / Pipe Repairs">🔧 Plumber & Tap / Pipe Repairs</option>
              <option value="Electrician & Light / Wiring Technician">⚡ Electrician & Light / Wiring Technician</option>
              <option value="Paving, Bricklaying & Kerb Assistant">🧱 Paving, Bricklaying & Kerb Assistant</option>
              <option value="Tiler & Grout Repairer">🔲 Tiler & Grout Repairer</option>
              <option value="Roof & Gutter Cleaner / Leak Sealer">🏠 Roof & Gutter Cleaner / Leak Sealer</option>
              <option value="Locksmith & Door Alignment Handyman">🚪 Locksmith & Door Alignment Handyman</option>
              <option value="Gate, Fence & Metal Welding Repair">⛓️ Gate, Fence & Metal Welding Repair</option>
            </optgroup>

            {/* Family, Childcare & Pet Care */}
            <optgroup label="Family, Childcare & Pet Care">
              <option value="Babysitter & Childcare / Nanny">👶 Babysitter & Childcare / Nanny</option>
              <option value="Dog Walker & Pet Sitting">🐕 Dog Walker & Pet Sitting</option>
              <option value="Cat Sitter & In-Home Pet Feeder">🐱 Cat Sitter & In-Home Pet Feeder</option>
              <option value="Elder Companion & Care Assistant">👵 Elder Companion & Care Assistant</option>
              <option value="Tutor & Homework Assistant">📚 Tutor & Homework Assistant</option>
            </optgroup>

            {/* Delivery, Logistics & Transport */}
            <optgroup label="Delivery, Logistics & Transport">
              <option value="Express Courier & Package Delivery">📦 Express Courier & Package Delivery</option>
              <option value="Food & Takeaway Delivery Courier">🍔 Food & Takeaway Delivery Courier</option>
              <option value="Car Washer & Mobile Auto Detailing">🚗 Car Washer & Mobile Auto Detailing</option>
              <option value="Bicycle Mechanic & Bike Tune-up">🚲 Bicycle Mechanic & Bike Tune-up</option>
              <option value="Tyre Puncture & Fitting Assistant">🛞 Tyre Puncture & Fitting Assistant</option>
            </optgroup>

            {/* Food, Cooking, Events & Hospitality */}
            <optgroup label="Food, Cooking, Events & Hospitality">
              <option value="Event Waiter & Catering Assistant">🍽️ Event Waiter & Catering Assistant</option>
              <option value="Event Bartender & Drinks Server">🍹 Event Bartender & Drinks Server</option>
              <option value="Braai Master, BBQ & Private Cook">🥩 Braai Master, BBQ & Private Cook</option>
              <option value="Home Baker & Pastry Assistant">🧁 Home Baker & Pastry Assistant</option>
              <option value="Event Setup, Tent & Stage Crew">🎪 Event Setup, Tent & Stage Crew</option>
              <option value="Mobile DJ & Sound System Operator">🎵 Mobile DJ & Sound System Operator</option>
            </optgroup>

            {/* Beauty, Hair, Grooming & Styling */}
            <optgroup label="Beauty, Hair, Grooming & Styling">
              <option value="Hairdresser & Barber / Mobile Braiding">✂️ Hairdresser & Barber / Mobile Braiding</option>
              <option value="Makeup Artist & Nail Technician">💄 Makeup Artist & Nail Technician</option>
              <option value="Manicure & Pedicure Specialist">💅 Manicure & Pedicure Specialist</option>
              <option value="Tailor, Seamstress & Clothing Alterations">🧵 Tailor, Seamstress & Clothing Alterations</option>
              <option value="Shoe Repairer & Sneaker Restorer">👞 Shoe Repairer & Sneaker Restorer</option>
            </optgroup>

            {/* Tech, Creative & Casual Admin */}
            <optgroup label="Tech, Creative & Office Assistance">
              <option value="Tech & Smart Home Setup Helper">💻 Tech & Smart Home Setup Helper</option>
              <option value="Phone / Laptop Repair & Diagnostics">📱 Phone / Laptop Repair & Diagnostics</option>
              <option value="Data Entry & Typing Assistant">⌨️ Data Entry & Typing Assistant</option>
              <option value="Casual Event Photographer & Video Recorder">📸 Casual Event Photographer & Video Recorder</option>
              <option value="Drone Aerial Photography & Video">🚁 Drone Aerial Photography & Video</option>
            </optgroup>

            {/* Other / Custom Option */}
            <optgroup label="Custom Casual Trade">
              <option value="Other / Custom Casual Trade">➕ Other / Custom Casual Trade (Type your own)</option>
            </optgroup>
          </select>

          {/* Custom Trade Input if selected */}
          {isCustomTrade && (
            <div className="mt-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specify Custom Trade or Skill <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="e.g. Solar Panel Cleaner, Knife Sharpener, etc."
                value={customTradeText}
                onChange={(e) => {
                  setCustomTradeText(e.target.value);
                  setValidationErrors((prev) => prev.filter((item) => item !== 'Custom Casual Trade Specification'));
                }}
                className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                  validationErrors.includes('Custom Casual Trade Specification') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
          )}
        </div>

        {/* Work Experiences (At least 1 required) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Work Experiences <span className="text-rose-500">* (At least 1 required)</span>
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              profile.experiences.filter((e) => e.trim()).length >= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {profile.experiences.filter((e) => e.trim()).length} Added
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {profile.experiences.map((exp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={isLocked}
                  value={exp}
                  placeholder={`Experience #${idx + 1}`}
                  onChange={(e) => {
                    const updated = [...profile.experiences];
                    updated[idx] = e.target.value;
                    setProfile({ ...profile, experiences: updated });
                    if (e.target.value.trim()) {
                      setValidationErrors((prev) => prev.filter((item) => item !== 'At least 1 Work Experience'));
                    }
                  }}
                  className={`flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                    validationErrors.includes('At least 1 Work Experience') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {!isLocked && profile.experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = profile.experiences.filter((_, i) => i !== idx);
                      setProfile({ ...profile, experiences: updated });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {!isLocked && (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Add another work experience (e.g. Cleaner at Hotel Sun - 2 yrs)..."
                  value={newExp}
                  onChange={(e) => setNewExp(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newExp.trim()) {
                      setProfile({ ...profile, experiences: [...profile.experiences, newExp.trim()] });
                      setNewExp('');
                      setValidationErrors((prev) => prev.filter((item) => item !== 'At least 1 Work Experience'));
                    }
                  }}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Add Experience
                </button>
              </div>
            )}
          </div>
        </div>

        {/* References (At least 1 required) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              References <span className="text-rose-500">* (At least 1 required)</span>
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              profile.references.filter((r) => r.trim()).length >= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {profile.references.filter((r) => r.trim()).length} Added
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {profile.references.map((ref, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={isLocked}
                  value={ref}
                  placeholder={`Reference #${idx + 1}`}
                  onChange={(e) => {
                    const updated = [...profile.references];
                    updated[idx] = e.target.value;
                    setProfile({ ...profile, references: updated });
                    if (e.target.value.trim()) {
                      setValidationErrors((prev) => prev.filter((item) => item !== 'At least 1 Reference'));
                    }
                  }}
                  className={`flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70 ${
                    validationErrors.includes('At least 1 Reference') ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {!isLocked && profile.references.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = profile.references.filter((_, i) => i !== idx);
                      setProfile({ ...profile, references: updated });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {!isLocked && (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Add another reference (e.g. Sarah M. (Client) - 083 123 4567)..."
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newRef.trim()) {
                      setProfile({ ...profile, references: [...profile.references, newRef.trim()] });
                      setNewRef('');
                      setValidationErrors((prev) => prev.filter((item) => item !== 'At least 1 Reference'));
                    }
                  }}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Add Reference
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Links (Optional) */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Social Media Links (Optional)</h3>
          <div className="flex flex-col gap-2">
            {profile.socialLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={isLocked}
                  value={link}
                  onChange={(e) => {
                    const updated = [...profile.socialLinks];
                    updated[idx] = e.target.value;
                    setProfile({ ...profile, socialLinks: updated });
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white disabled:opacity-70"
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = profile.socialLinks.filter((_, i) => i !== idx);
                      setProfile({ ...profile, socialLinks: updated });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {!isLocked && (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Add social link (e.g. https://instagram.com/...)"
                  value={newSocial}
                  onChange={(e) => setNewSocial(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSocial.trim()) {
                      setProfile({ ...profile, socialLinks: [...profile.socialLinks, newSocial.trim()] });
                      setNewSocial('');
                    }
                  }}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Add Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save & Lock Button */}
        {!isLocked && (
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-2xl shadow-xl transition mt-2 flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Save Profile (Lock & Remember Information)
          </button>
        )}

      </form>
    </ModalBase>
  );
};
