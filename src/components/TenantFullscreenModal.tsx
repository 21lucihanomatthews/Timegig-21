import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Receipt,
  Users,
  LayoutDashboard,
  Upload,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Link as LinkIcon,
} from 'lucide-react';
import { TenantTab, TenantReferral, TenantPoPRecord, UserPoPRecord } from '../types';
import { getPersistentItem, savePersistentItem } from '../utils/storage';

interface TenantFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantFullscreenModal: React.FC<TenantFullscreenModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TenantTab>('overview');
  const [tenantName, setTenantName] = useState('My TimeGiG Tenant Hub');
  const [tenantCode, setTenantCode] = useState('TIMEGIG-TNT-7842');
  const [joinLink, setJoinLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Tenant PoP state
  const [tenantPoPList, setTenantPoPList] = useState<TenantPoPRecord[]>([]);

  // User PoP state
  const [userPoPList, setUserPoPList] = useState<UserPoPRecord[]>([]);

  // Referrals managed by this tenant (who joined through the link)
  const [referrals, setReferrals] = useState<TenantReferral[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending PoP' | 'Inactive'>('All');

  // Add Referral Modal
  const [showAddReferralModal, setShowAddReferralModal] = useState(false);
  const [newRefName, setNewRefName] = useState('');
  const [newRefPhone, setNewRefPhone] = useState('');
  const [newRefEmail, setNewRefEmail] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Compute join link whenever tenantCode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const path = window.location.pathname;
      setJoinLink(`${origin}${path}?ref=${tenantCode}`);
    } else {
      setJoinLink(`https://timegig.app/join?ref=${tenantCode}`);
    }
  }, [tenantCode]);

  // Load persistent tenant details, referral link/code, and referrals
  useEffect(() => {
    async function loadTenantData() {
      try {
        const savedName = await getPersistentItem<string>('tenant_name');
        if (savedName) setTenantName(savedName);

        let savedCode = await getPersistentItem<string>('tenant_referral_code');
        if (!savedCode) {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          savedCode = `TGIG-TNT-${randomSuffix}`;
          await savePersistentItem('tenant_referral_code', savedCode);
        }
        setTenantCode(savedCode);

        const savedReferrals = await getPersistentItem<TenantReferral[]>('tenant_referrals');
        if (savedReferrals && Array.isArray(savedReferrals)) {
          setReferrals(savedReferrals);
        } else {
          // Initial sample referrals who joined through the tenant's link
          const initialReferrals: TenantReferral[] = [
            {
              id: 'ref_1',
              fullName: 'Sipho Ndlovu',
              phone: '+27 72 384 1928',
              email: 'sipho.ndlovu@gmail.com',
              joinedAt: '2 days ago via Link',
              plan: 'User Subscription (R29.99/mo)',
              status: 'Active',
              monthlyFee: 'R29.99',
              popSubmitted: true,
              popRef: 'POP-9941-NDL',
              lastPaymentDate: '15 Oct 2026',
            },
            {
              id: 'ref_2',
              fullName: 'Thandiwe Khumalo',
              phone: '+27 83 491 2049',
              email: 'thandi.k@outlook.com',
              joinedAt: '4 days ago via Link',
              plan: 'User Subscription (R29.99/mo)',
              status: 'Pending PoP',
              monthlyFee: 'R29.99',
              popSubmitted: false,
            },
            {
              id: 'ref_3',
              fullName: 'David Van Der Merwe',
              phone: '+27 82 501 9382',
              email: 'david.vdm@webmail.co.za',
              joinedAt: '1 week ago via Link',
              plan: 'User Subscription (R29.99/mo)',
              status: 'Active',
              monthlyFee: 'R29.99',
              popSubmitted: true,
              popRef: 'POP-7720-VDM',
              lastPaymentDate: '12 Oct 2026',
            },
          ];
          setReferrals(initialReferrals);
          await savePersistentItem('tenant_referrals', initialReferrals);
        }

        const savedTenantPoPs = await getPersistentItem<TenantPoPRecord[]>('tenant_pop_records');
        if (savedTenantPoPs && Array.isArray(savedTenantPoPs)) {
          setTenantPoPList(savedTenantPoPs);
        }

        const savedUserPoPs = await getPersistentItem<UserPoPRecord[]>('user_pop_records');
        if (savedUserPoPs && Array.isArray(savedUserPoPs)) {
          setUserPoPList(savedUserPoPs);
        }
      } catch (err) {
        console.warn('Error loading tenant data:', err);
      }
    }

    if (isOpen) {
      loadTenantData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3200);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopiedLink(true);
      triggerToast('Referral link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      triggerToast(joinLink);
    }
  };

  // Social Sharing Handlers with the referral link
  const shareMessage = `Join TimeGiG using my Tenant Referral Link to find local gigs and hire verified workers! Sign up here: ${joinLink}`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(joinLink)}&quote=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(joinLink)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(joinLink)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TimeGiG with Tenant Referral Link',
          text: shareMessage,
          url: joinLink,
        });
      } catch {
        // Dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  // Simulate someone joining through the referral link
  const handleSimulateLinkJoin = () => {
    const names = [
      'Bongani Zondo',
      'Naledi Dlamini',
      'Kagiso Mokoena',
      'Anika Patel',
      'Pieter Botha',
      'Zanele Sithole',
      'Michael Khumalo',
    ];
    const pickedName = names[Math.floor(Math.random() * names.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newRef: TenantReferral = {
      id: `ref_link_${Date.now()}`,
      fullName: pickedName,
      phone: `+27 7${Math.floor(10 + Math.random() * 89)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(1000 + Math.random() * 8999)}`,
      email: `${pickedName.toLowerCase().replace(/\s+/g, '.')}${randomDigits}@gmail.com`,
      joinedAt: 'Just now via Link',
      plan: 'User Subscription (R29.99/mo)',
      status: 'Active',
      monthlyFee: 'R29.99',
      popSubmitted: true,
      popRef: `POP-LINK-${randomDigits}`,
      lastPaymentDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
    };

    const updated = [newRef, ...referrals];
    setReferrals(updated);
    savePersistentItem('tenant_referrals', updated);
    triggerToast(`🎉 ${pickedName} joined through your referral link! Total Referrals updated.`);
  };

  // Tenant PoP Upload handler
  const handleUploadTenantPoP = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const randomRef = `TN-POP-${Math.floor(100000 + Math.random() * 900000)}`;
      const newPoP: TenantPoPRecord = {
        id: `tpop_${Date.now()}`,
        referenceNumber: randomRef,
        amount: 'R299.99',
        uploadedAt: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
        documentName: file.name,
        documentSize: file.size,
        documentType: file.type || 'application/pdf',
        status: 'Verified',
        notes: 'Monthly R299.99 Tenant subscription maintenance proof',
      };

      const updated = [newPoP, ...tenantPoPList];
      setTenantPoPList(updated);
      savePersistentItem('tenant_pop_records', updated);
      triggerToast('Tenant Proof of Payment uploaded successfully!');
    }
  };

  const handleClearTenantPoP = () => {
    setTenantPoPList([]);
    savePersistentItem('tenant_pop_records', []);
    triggerToast('Tenant PoP cleared to empty state.');
  };

  const handleClearUserPoP = () => {
    setUserPoPList([]);
    savePersistentItem('user_pop_records', []);
    triggerToast('User PoP cleared to empty state.');
  };

  // Referral Management actions
  const handleApprovePoP = (refId: string) => {
    const updated = referrals.map((r) => {
      if (r.id === refId) {
        return {
          ...r,
          status: 'Active' as const,
          popSubmitted: true,
          popRef: `POP-APPROVED-${Math.floor(1000 + Math.random() * 9000)}`,
          lastPaymentDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
        };
      }
      return r;
    });
    setReferrals(updated);
    savePersistentItem('tenant_referrals', updated);
    triggerToast('User PoP approved! Referral account marked Active.');
  };

  const handleToggleReferralStatus = (refId: string) => {
    const updated = referrals.map((r) => {
      if (r.id === refId) {
        const nextStatus = r.status === 'Active' ? 'Inactive' : 'Active';
        return { ...r, status: nextStatus as 'Active' | 'Inactive' };
      }
      return r;
    });
    setReferrals(updated);
    savePersistentItem('tenant_referrals', updated);
    triggerToast('Referral status updated.');
  };

  const handleRemoveReferral = (refId: string) => {
    const updated = referrals.filter((r) => r.id !== refId);
    setReferrals(updated);
    savePersistentItem('tenant_referrals', updated);
    triggerToast('Referral removed.');
  };

  const handleAddReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefName.trim() || !newRefPhone.trim()) {
      alert('Please enter member name and phone number.');
      return;
    }

    const newRef: TenantReferral = {
      id: `ref_${Date.now()}`,
      fullName: newRefName.trim(),
      phone: newRefPhone.trim(),
      email: newRefEmail.trim() || `${newRefName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      joinedAt: 'Just now via Link',
      plan: 'User Subscription (R29.99/mo)',
      status: 'Active',
      monthlyFee: 'R29.99',
      popSubmitted: true,
      popRef: `POP-${Math.floor(1000 + Math.random() * 9000)}`,
      lastPaymentDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
    };

    const updated = [newRef, ...referrals];
    setReferrals(updated);
    savePersistentItem('tenant_referrals', updated);
    setShowAddReferralModal(false);
    setNewRefName('');
    setNewRefPhone('');
    setNewRefEmail('');
    triggerToast(`Added ${newRef.fullName} to your managed referrals!`);
  };

  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-800 flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-white px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Discrete floating Exit button (TOP MENU BAR REMOVED AS REQUESTED) */}
      <button
        onClick={onClose}
        className="fixed top-3 right-3 z-50 w-8 h-8 rounded-full bg-white/95 hover:bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
        title="Exit to Map"
        aria-label="Exit to Map"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Main Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 p-3 sm:p-4 max-w-4xl mx-auto w-full">
        
        {/* ===================== TAB 1: OVERVIEW ===================== */}
        {/* PROMPT REQUIREMENT: "make every feature small inside the overview feature." */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-3">
            
            {/* 1. Small Top Header inside Overview */}
            <div className="flex items-center justify-between gap-2 pt-1 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-bold text-slate-900">{tenantName}</h2>
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded">
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Tenant Hub • R299.99/mo Subscription
                  </p>
                </div>
              </div>

              {/* Small Action Buttons */}
              <div className="flex items-center gap-1.5 pr-8 sm:pr-0">
                <button
                  onClick={handleSimulateLinkJoin}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-semibold rounded-lg transition flex items-center gap-1"
                  title="Simulate someone clicking your referral link and joining"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span className="hidden sm:inline">Simulate</span> Link Join
                </button>
                <button
                  onClick={() => setShowAddReferralModal(true)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Member</span>
                </button>
              </div>
            </div>

            {/* 2. THREE SMALL CORE METRIC CARDS:
                1. Total Referrals (Joined Through Link)
                2. Tenant PoP
                3. User PoP
            */}
            <div className="grid grid-cols-3 gap-2">
              
              {/* Metric 1: Total Referrals Joined Through Link */}
              <div
                onClick={() => setActiveTab('managed_referrals')}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-amber-300 rounded-xl flex flex-col justify-between shadow-xs cursor-pointer transition"
                title="View Managed Referrals on bottom menu bar"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    Total Referrals
                  </span>
                  <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                </div>
                <div className="my-1">
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {referrals.length}
                  </p>
                  <p className="text-[9px] text-amber-700 font-medium mt-0.5 truncate">
                    Joined via your link
                  </p>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                  <span>Active: <strong className="text-slate-800">{referrals.filter((r) => r.status === 'Active').length}</strong></span>
                  <span className="text-amber-600 font-semibold">Manage →</span>
                </div>
              </div>

              {/* Metric 2: Tenant PoP */}
              <div
                onClick={() => setActiveTab('tenant_pop')}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-sky-300 rounded-xl flex flex-col justify-between shadow-xs cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    Tenant PoP
                  </span>
                  <div className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center">
                    <Receipt className="w-3 h-3" />
                  </div>
                </div>
                <div className="my-1">
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {tenantPoPList.length}
                  </p>
                  <p className="text-[9px] text-sky-700 font-medium mt-0.5 truncate">
                    {tenantPoPList.length > 0 ? 'Verified & Active' : '0 Uploads'}
                  </p>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                  <span>R299.99/mo</span>
                  <span className="text-sky-600 font-semibold">View →</span>
                </div>
              </div>

              {/* Metric 3: User PoP */}
              <div
                onClick={() => setActiveTab('user_pop')}
                className="p-2.5 bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-xl flex flex-col justify-between shadow-xs cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    User PoP
                  </span>
                  <div className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                </div>
                <div className="my-1">
                  <p className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {userPoPList.length}
                  </p>
                  <p className="text-[9px] text-purple-700 font-medium mt-0.5 truncate">
                    {userPoPList.length > 0 ? `${userPoPList.length} Submitted` : '0 Submitted'}
                  </p>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px] text-slate-500">
                  <span>User Proofs</span>
                  <span className="text-purple-600 font-semibold">View →</span>
                </div>
              </div>

            </div>

            {/* 3. SMALL REFERRAL LINK & SHARING BAR (PROMPT REQUIREMENT) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[11px] font-bold text-slate-900">
                      Tenant Referral Link
                    </span>
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-semibold rounded">
                      Earns from Joins
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Whoever joins through this link is linked to your account and appears in your Total Referrals.
                  </p>
                </div>

                {/* Link Box with Copy Button */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 sm:w-64 flex items-center px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                    <span className="font-mono text-[10px] text-slate-700 truncate select-all">
                      {joinLink}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 shadow-2xs shrink-0"
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Small Social Media Sharing Chips */}
              <div className="pt-1.5 border-t border-slate-200/60 flex flex-wrap items-center gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Share Link:</span>
                
                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="px-2 py-0.8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-medium rounded-md transition flex items-center gap-1"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                </button>

                {/* Facebook */}
                <button
                  onClick={handleShareFacebook}
                  className="px-2 py-0.8 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-medium rounded-md transition flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3 text-blue-600" /> Facebook
                </button>

                {/* Twitter / X */}
                <button
                  onClick={handleShareTwitter}
                  className="px-2 py-0.8 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-medium rounded-md transition flex items-center gap-1"
                >
                  <span className="font-bold text-[9px]">𝕏</span> X
                </button>

                {/* Telegram */}
                <button
                  onClick={handleShareTelegram}
                  className="px-2 py-0.8 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[10px] font-medium rounded-md transition flex items-center gap-1"
                >
                  <Send className="w-3 h-3 text-sky-600" /> Telegram
                </button>

                {/* LinkedIn */}
                <button
                  onClick={handleShareLinkedIn}
                  className="px-2 py-0.8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-medium rounded-md transition flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3 text-indigo-600" /> LinkedIn
                </button>

                {/* More */}
                <button
                  onClick={handleNativeShare}
                  className="px-2 py-0.8 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-medium rounded-md transition flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3 text-slate-500" /> More
                </button>
              </div>
            </div>

            {/* 4. MANAGED REFERRALS SHORTCUT (FEATURE MOVED TO BOTTOM MENU BAR) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      Managed Referrals ({referrals.length})
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-semibold rounded">
                      Available on Bottom Menu Bar
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Moved to dedicated bottom menu bar. Tap to open full member directory, verify user PoPs, and chat on WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setActiveTab('managed_referrals')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Open Managed Referrals</span>
                  <span>→</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ===================== TAB: MANAGED REFERRALS (MOVED TO BOTTOM MENU BAR) ===================== */}
        {activeTab === 'managed_referrals' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Managed Referrals ({referrals.length})
                  </h2>
                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded">
                    Branch Roster
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Users registered through your referral link. Manage subscriptions, approve user PoPs, and reach out on WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  onClick={handleSimulateLinkJoin}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-semibold rounded-lg transition flex items-center gap-1"
                  title="Simulate someone clicking your referral link and joining"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulate Link Join</span>
                </button>
                <button
                  onClick={() => setShowAddReferralModal(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-semibold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>
            </div>

            {/* Branch Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Joined</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">{referrals.length}</p>
                <p className="text-[9px] text-slate-500 truncate">Via Referral Link</p>
              </div>
              <div className="p-2 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Active Paying</p>
                <p className="text-base font-extrabold text-emerald-800 mt-0.5">
                  {referrals.filter((r) => r.status === 'Active').length}
                </p>
                <p className="text-[9px] text-emerald-700 truncate">R29.99/mo each</p>
              </div>
              <div className="p-2 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                <p className="text-[10px] font-bold text-amber-700 uppercase">Pending PoP</p>
                <p className="text-base font-extrabold text-amber-800 mt-0.5">
                  {referrals.filter((r) => r.status === 'Pending PoP').length}
                </p>
                <p className="text-[9px] text-amber-700 truncate">Awaiting review</p>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Monthly Branch</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  R{(referrals.filter((r) => r.status === 'Active').length * 29.99).toFixed(2)}
                </p>
                <p className="text-[9px] text-slate-500 truncate">Active revenue</p>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone (+27), email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All Statuses ({referrals.length})</option>
                  <option value="Active">Active ({referrals.filter((r) => r.status === 'Active').length})</option>
                  <option value="Pending PoP">Pending PoP ({referrals.filter((r) => r.status === 'Pending PoP').length})</option>
                  <option value="Inactive">Inactive ({referrals.filter((r) => r.status === 'Inactive').length})</option>
                </select>

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-medium rounded-md transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Referrals List */}
            {filteredReferrals.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                  <Users className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">No managed referrals found</h3>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  {searchQuery || statusFilter !== 'All'
                    ? 'No members match the specified search query or filter.'
                    : 'Share your referral link on social media to have new members join and be managed under your branch.'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSimulateLinkJoin}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Simulate Link Join
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition flex items-center gap-1"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-amber-600" /> Copy Referral Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredReferrals.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {ref.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{ref.fullName}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                              ref.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ref.status === 'Pending PoP'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ref.status}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded flex items-center gap-0.5">
                            <LinkIcon className="w-2.5 h-2.5 text-amber-600" /> Joined via Link
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium">
                            {ref.plan}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {ref.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" /> {ref.email}
                          </span>
                          <span className="text-slate-400">📅 {ref.joinedAt}</span>
                          {ref.popRef && (
                            <span className="text-purple-600 font-medium">PoP: {ref.popRef}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Management Controls */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {ref.status === 'Pending PoP' ? (
                        <button
                          onClick={() => handleApprovePoP(ref.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg shadow-2xs transition flex items-center gap-1"
                          title="Approve user proof of payment"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve PoP
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleReferralStatus(ref.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg transition"
                        >
                          {ref.status === 'Active' ? 'Set Inactive' : 'Set Active'}
                        </button>
                      )}

                      <a
                        href={`https://wa.me/${ref.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${ref.fullName}, this is your TimeGiG Tenant manager regarding your monthly account subscription.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      </a>

                      <button
                        onClick={() => handleRemoveReferral(ref.id)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Remove referral"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: VERIFICATION ===================== */}
        {/* PROMPT REQUIREMENT: "Make features empty when clicked on" */}
        {activeTab === 'verification' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Candidate & Tenant Verification Queue
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review and approve identity documents, face selfies, and background checks for your tenant branch.
              </p>
            </div>

            {/* Filter chips showing 0 counts */}
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded-md">
                All (0)
              </span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-medium rounded-md">
                Pending Audit (0)
              </span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-medium rounded-md">
                Approved (0)
              </span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-medium rounded-md">
                Rejected (0)
              </span>
            </div>

            {/* Empty State Presentation */}
            <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <ShieldCheck className="w-6 h-6 text-slate-400" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-xs font-bold text-slate-900">No Verifications Pending</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  The verification queue is currently empty. When candidates or workers submit their government IDs and facial verification to your tenant branch, they will appear here.
                </p>
              </div>

              <button
                onClick={() => triggerToast('Verification queue refreshed: 0 pending.')}
                className="mt-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Queue
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: TENANT PoP ===================== */}
        {/* PROMPT REQUIREMENT: "Make features empty when clicked on" */}
        {activeTab === 'tenant_pop' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-sky-600" />
                  Tenant Proof of Payment (PoP)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Monthly account maintenance proof of payment (R299.99/month to keep tenant branch active).
                </p>
              </div>

              {tenantPoPList.length > 0 && (
                <button
                  onClick={handleClearTenantPoP}
                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[10px] font-medium rounded-lg transition flex items-center gap-1 self-start sm:self-auto"
                >
                  <Trash2 className="w-3 h-3" /> Clear to Empty State
                </button>
              )}
            </div>

            {/* Empty state presentation */}
            {tenantPoPList.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-xs font-bold text-slate-900">No Tenant Proof of Payment Uploaded Yet</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    You have not submitted a Proof of Payment for the R299.99 monthly tenant account fee. You can upload your electronic bank receipt below to keep your ledger recorded.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <label className="cursor-pointer px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload PoP Receipt</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleUploadTenantPoP}
                    />
                  </label>
                  <button
                    onClick={() => triggerToast('Ledger checked: 0 records found.')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-lg transition"
                  >
                    Check Bank Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Uploaded Tenant PoP Slips ({tenantPoPList.length})</span>
                  <label className="cursor-pointer text-[11px] text-sky-600 font-bold hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Upload Another
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={handleUploadTenantPoP}
                    />
                  </label>
                </div>

                {tenantPoPList.map((pop) => (
                  <div
                    key={pop.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900">{pop.documentName}</p>
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded">
                            {pop.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Amount: <strong className="text-slate-800">{pop.amount}</strong> • Ref: {pop.referenceNumber} • Date: {pop.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleClearTenantPoP}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete / Reset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: USER PoP ===================== */}
        {/* PROMPT REQUIREMENT: "Make features empty when clicked on" */}
        {activeTab === 'user_pop' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  User Proof of Payment (PoP)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Manage monthly R29.99 subscription receipts submitted by users who joined through your referral link.
                </p>
              </div>

              {userPoPList.length > 0 && (
                <button
                  onClick={handleClearUserPoP}
                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-[10px] font-medium rounded-lg transition flex items-center gap-1 self-start sm:self-auto"
                >
                  <Trash2 className="w-3 h-3" /> Clear to Empty State
                </button>
              )}
            </div>

            {/* Filter chips showing 0 counts */}
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-md">
                All (0)
              </span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-medium rounded-md">
                Pending Verification (0)
              </span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-medium rounded-md">
                Approved (0)
              </span>
              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-medium rounded-md">
                Declined (0)
              </span>
            </div>

            {/* Empty state presentation */}
            {userPoPList.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2.5 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-xs font-bold text-slate-900">No User Proof of Payment Receipts</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    None of your referred users have submitted monthly R29.99 proof of payment receipts yet. When users who registered through your link upload payment receipts, they will appear here.
                  </p>
                </div>

                <button
                  onClick={() => triggerToast('User PoP repository checked: 0 pending.')}
                  className="mt-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> Check Submissions
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {userPoPList.map((upop) => (
                  <div
                    key={upop.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{upop.userName} • {upop.documentName}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Amount: {upop.amount} • Submitted: {upop.submittedAt}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* DEDICATED FULLSCREEN TENANT BOTTOM MENU BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 sm:px-3 py-1.5 flex items-center justify-around shadow-lg">
        
        {/* 1. Overview */}
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-2.5 rounded-lg transition ${
            activeTab === 'overview'
              ? 'text-amber-600 font-bold bg-amber-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Overview"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[9px] sm:text-[10px] tracking-tight">Overview</span>
        </button>

        {/* 2. Managed Referrals (MOVED TO BOTTOM MENU BAR) */}
        <button
          type="button"
          onClick={() => setActiveTab('managed_referrals')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-2.5 rounded-lg transition ${
            activeTab === 'managed_referrals'
              ? 'text-amber-600 font-bold bg-amber-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Managed Referrals"
        >
          <div className="relative">
            <Users className="w-4 h-4" />
            <span className="absolute -top-1 -right-2 min-w-[14px] h-3.5 px-0.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
              {referrals.length}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight whitespace-nowrap">Managed Referrals</span>
        </button>

        {/* 3. Verification */}
        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-2.5 rounded-lg transition ${
            activeTab === 'verification'
              ? 'text-emerald-600 font-bold bg-emerald-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Verification"
        >
          <div className="relative">
            <ShieldCheck className="w-4 h-4" />
            <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-slate-100 text-slate-500 text-[8px] font-bold rounded-full flex items-center justify-center border border-slate-200">
              0
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight">Verification</span>
        </button>

        {/* 4. Tenant PoP */}
        <button
          type="button"
          onClick={() => setActiveTab('tenant_pop')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-2.5 rounded-lg transition ${
            activeTab === 'tenant_pop'
              ? 'text-sky-600 font-bold bg-sky-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Tenant PoP"
        >
          <div className="relative">
            <Receipt className="w-4 h-4" />
            <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-slate-100 text-slate-500 text-[8px] font-bold rounded-full flex items-center justify-center border border-slate-200">
              {tenantPoPList.length}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight">Tenant PoP</span>
        </button>

        {/* 5. User PoP */}
        <button
          type="button"
          onClick={() => setActiveTab('user_pop')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 sm:px-2.5 rounded-lg transition ${
            activeTab === 'user_pop'
              ? 'text-purple-600 font-bold bg-purple-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="User PoP"
        >
          <div className="relative">
            <FileText className="w-4 h-4" />
            <span className="absolute -top-1 -right-1.5 w-3 h-3 bg-slate-100 text-slate-500 text-[8px] font-bold rounded-full flex items-center justify-center border border-slate-200">
              {userPoPList.length}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] tracking-tight">User PoP</span>
        </button>

      </nav>

      {/* Add Referral Modal */}
      {showAddReferralModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                Add Member Joined Through Link
              </h3>
              <button
                onClick={() => setShowAddReferralModal(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleAddReferralSubmit} className="flex flex-col gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">
                  Member Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lerato Moloi"
                  value={newRefName}
                  onChange={(e) => setNewRefName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +27 71 234 5678"
                  value={newRefPhone}
                  onChange={(e) => setNewRefPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. lerato@gmail.com"
                  value={newRefEmail}
                  onChange={(e) => setNewRefEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800">
                Registered under your referral link on the R29.99/mo User Subscription plan.
              </div>

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm transition"
                >
                  Save Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddReferralModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
