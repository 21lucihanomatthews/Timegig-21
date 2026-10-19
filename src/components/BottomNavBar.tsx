import React from 'react';
import { Plus, Key, Building2, Users, User, Lock } from 'lucide-react';

interface BottomNavBarProps {
  isTenantUnlocked: boolean;
  onOpenCreateGig: () => void;
  onOpenActivation: () => void;
  onOpenTenant: () => void;
  onOpenSeekers: () => void;
  onOpenProfile: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  isTenantUnlocked,
  onOpenCreateGig,
  onOpenActivation,
  onOpenTenant,
  onOpenSeekers,
  onOpenProfile,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between shadow-lg">
      
      {/* Activation Icon */}
      <button
        onClick={onOpenActivation}
        className="flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
        title="Activation"
      >
        <Key className="w-4 h-4" />
        <span className="text-[9px] font-medium">Activation</span>
      </button>

      {/* Tenant Icon (Locked unless user chose Become a Tenant) */}
      <button
        onClick={onOpenTenant}
        className={`flex flex-col items-center gap-0.5 transition ${
          isTenantUnlocked
            ? 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400'
            : 'text-slate-400 dark:text-slate-500 hover:text-amber-500'
        }`}
        title={isTenantUnlocked ? 'Tenant Workspace (Active)' : 'Tenant Workspace (Locked - Choose Become a Tenant to unlock)'}
      >
        <div className="relative">
          <Building2 className="w-4 h-4" />
          {!isTenantUnlocked && (
            <div className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow">
              <Lock className="w-1.5 h-1.5 stroke-[3]" />
            </div>
          )}
        </div>
        <span className="text-[9px] font-medium flex items-center gap-0.5">
          Tenant
          {!isTenantUnlocked && <Lock className="w-2 h-2 text-amber-500" />}
        </span>
      </button>

      {/* Center Create Gig Post (+) Button on top of bottom menu bar */}
      <div className="relative -top-5">
        <button
          onClick={onOpenCreateGig}
          className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 ring-3 ring-white dark:ring-slate-900"
          title="Create Gig Post"
        >
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-30"></div>
          <Plus className="w-6 h-6 transform group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Seekers Icon */}
      <button
        onClick={onOpenSeekers}
        className="flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
        title="Seekers"
      >
        <Users className="w-4 h-4" />
        <span className="text-[9px] font-medium">Seekers</span>
      </button>

      {/* Profile Icon */}
      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition"
        title="Profile"
      >
        <User className="w-4 h-4" />
        <span className="text-[9px] font-medium">Profile</span>
      </button>

    </div>
  );
};
