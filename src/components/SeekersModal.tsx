import React, { useState, useEffect } from 'react';
import { X, Users, Star, ShieldCheck, MapPin, Power, Clock, Calendar, CheckCircle2, DollarSign, Sparkles, Navigation, ArrowRight } from 'lucide-react';
import { UserLocation, Gig, Seeker, ProfileData } from '../types';
import { getPersistentItem, savePersistentItem } from '../utils/storage';

interface SeekersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  selfieUrl: string | null;
  onHireSeeker: (gig: Gig) => void;
}

// Only ONLINE seekers looking to get hired for their casual services
const INITIAL_ONLINE_SEEKERS: Seeker[] = [
  {
    id: 'sk-1',
    name: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    trade: 'Express Courier & Delivery',
    rating: 4.95,
    reviewCount: 48,
    distance: '0.2 mi away',
    status: 'Online',
    rateType: 'hourly',
    rateAmount: 'R95/hr',
    lat: 0,
    lng: 0,
  },
  {
    id: 'sk-2',
    name: 'Sophia Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
    trade: 'Electrician & Light Wiring Technician',
    rating: 5.0,
    reviewCount: 62,
    distance: '0.5 mi away',
    status: 'Online',
    rateType: 'hourly',
    rateAmount: 'R180/hr',
    lat: 0,
    lng: 0,
  },
  {
    id: 'sk-3',
    name: 'Thabo Molefe',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    trade: 'Painter & Wall Decorator',
    rating: 4.9,
    reviewCount: 39,
    distance: '0.8 mi away',
    status: 'Online',
    rateType: 'daily',
    rateAmount: 'R650/day',
    lat: 0,
    lng: 0,
  },
  {
    id: 'sk-4',
    name: 'Liam O’Connor',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=faces',
    trade: 'Handyman & Furniture Assembly',
    rating: 4.88,
    reviewCount: 31,
    distance: '1.1 mi away',
    status: 'Online',
    rateType: 'hourly',
    rateAmount: 'R120/hr',
    lat: 0,
    lng: 0,
  },
  {
    id: 'sk-5',
    name: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=faces',
    trade: 'House Cleaning & Maid Services',
    rating: 4.92,
    reviewCount: 54,
    distance: '1.3 mi away',
    status: 'Online',
    rateType: 'daily',
    rateAmount: 'R450/day',
    lat: 0,
    lng: 0,
  },
  {
    id: 'sk-6',
    name: 'Nomvula Dlamini',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&h=120&fit=crop&crop=faces',
    trade: 'Babysitter & Childcare / Nanny',
    rating: 4.96,
    reviewCount: 42,
    distance: '1.5 mi away',
    status: 'Online',
    rateType: 'hourly',
    rateAmount: 'R80/hr',
    lat: 0,
    lng: 0,
  },
  {
    id: 'sk-7',
    name: 'Bradley King',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces',
    trade: 'Mobile Car Washer & Auto Valet',
    rating: 4.9,
    reviewCount: 27,
    distance: '1.8 mi away',
    status: 'Online',
    rateType: 'hourly',
    rateAmount: 'R140/hr',
    lat: 0,
    lng: 0,
  },
  {
    id: 'sk-8',
    name: 'Sipho Ndlovu',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop&crop=faces',
    trade: 'Gardener & Lawn Mowing',
    rating: 4.85,
    reviewCount: 35,
    distance: '2.0 mi away',
    status: 'Online',
    rateType: 'daily',
    rateAmount: 'R400/day',
    lat: 0,
    lng: 0,
  },
];

export const SeekersModal: React.FC<SeekersModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  selfieUrl,
  onHireSeeker,
}) => {
  // Current user's online seeker availability status & rates
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [rateType, setRateType] = useState<'hourly' | 'daily'>('hourly');
  const [rateNumber, setRateNumber] = useState('120');
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);

  // Load persistent seeker online status and rate preferences
  useEffect(() => {
    async function loadSeekerPreferences() {
      try {
        const savedOnline = await getPersistentItem<boolean>('seeker_is_online');
        if (savedOnline !== null) {
          setIsUserOnline(savedOnline);
        }
        const savedRateType = await getPersistentItem<'hourly' | 'daily'>('seeker_rate_type');
        if (savedRateType) {
          setRateType(savedRateType);
        }
        const savedRateNum = await getPersistentItem<string>('seeker_rate_number');
        if (savedRateNum) {
          setRateNumber(savedRateNum);
        }
        const profile = await getPersistentItem<ProfileData>('user_profile');
        if (profile) {
          setUserProfile(profile);
        }
      } catch (err) {
        console.warn('Error loading seeker settings:', err);
      }
    }
    if (isOpen) {
      loadSeekerPreferences();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle on/off appearing on seekers list
  const handleToggleOnline = (newStatus: boolean) => {
    setIsUserOnline(newStatus);
    savePersistentItem('seeker_is_online', newStatus);
  };

  const handleRateTypeChange = (type: 'hourly' | 'daily') => {
    setRateType(type);
    savePersistentItem('seeker_rate_type', type);
    if (type === 'hourly' && (rateNumber === '650' || parseInt(rateNumber) > 400)) {
      setRateNumber('120');
      savePersistentItem('seeker_rate_number', '120');
    } else if (type === 'daily' && (rateNumber === '120' || parseInt(rateNumber) < 300)) {
      setRateNumber('650');
      savePersistentItem('seeker_rate_number', '650');
    }
  };

  const handleRateNumberChange = (num: string) => {
    const cleaned = num.replace(/[^0-9]/g, '');
    setRateNumber(cleaned);
    savePersistentItem('seeker_rate_number', cleaned);
  };

  const currentFormattedRate = `R${rateNumber || '0'}/${rateType === 'hourly' ? 'hr' : 'day'}`;

  // When a seeker is hired
  const handleHire = (seeker: Seeker) => {
    // Offset coordinates slightly near user so destination pin and route are drawn cleanly
    const destLat = userLocation.lat + 0.0025;
    const destLng = userLocation.lng + 0.0025;

    const hiredGig: Gig = {
      id: `hired-${seeker.id}-${Date.now()}`,
      title: `${seeker.trade} - ${seeker.name}`,
      category: 'Services',
      pay: seeker.rateAmount,
      distance: seeker.distance,
      lat: destLat,
      lng: destLng,
      description: `Service engagement hired directly from Seekers radar. Seeker: ${seeker.name} • Trade: ${seeker.trade} • Agreed Rate: ${seeker.rateAmount}. Ready to perform task at user destination.`,
      duration: seeker.rateType === 'hourly' ? '1 hour' : '1 full day',
      clientName: seeker.name,
      clientRating: seeker.rating,
      status: 'accepted',
    };

    onHireSeeker(hiredGig);
  };

  const userName = userProfile?.fullName || (userProfile?.firstName ? `${userProfile.firstName} ${userProfile.surname}`.trim() : 'Alex Rivera');
  const userTrade = userProfile?.trade || 'House Cleaning & Maid Services';
  const userAvatar = selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Gig Seekers</h2>
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online Only
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Available workers looking to get hired for casual services</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Seekers Bar: ON / OFF Small Icon & Seeker Rate Configuration */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleToggleOnline(!isUserOnline)}
                className={`flex items-center justify-center w-8 h-8 rounded-xl shadow-md transition transform active:scale-95 ${
                  isUserOnline
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/50 shadow-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300'
                }`}
                title={isUserOnline ? 'Click to go Offline' : 'Click to go Online and appear on hire list'}
              >
                <Power className="w-4 h-4 stroke-[2.5]" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Appear on Seekers List to Get Hired
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isUserOnline
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isUserOnline ? 'Online (ON)' : 'Offline (OFF)'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isUserOnline
                    ? 'You are active and listed below. Clients can hire your services.'
                    : 'Click the ON/OFF icon to get listed and set your rate.'}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => handleToggleOnline(!isUserOnline)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isUserOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                  isUserOnline ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Rate Setup Box (Accessible when Seeker is Online or configuring) */}
          {isUserOnline && (
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  Set Your Service Rate:
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  {currentFormattedRate}
                </span>
              </div>

              {/* Rate Type Selector: Hourly vs Daily */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRateTypeChange('hourly')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    rateType === 'hourly'
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Hourly Rate (/hr)
                </button>
                <button
                  type="button"
                  onClick={() => handleRateTypeChange('daily')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    rateType === 'daily'
                      ? 'bg-sky-500 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" /> Daily Rate (/day)
                </button>
              </div>

              {/* Rate Amount Input & Quick Chips */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
                  <input
                    type="text"
                    value={rateNumber}
                    onChange={(e) => handleRateNumberChange(e.target.value)}
                    placeholder={rateType === 'hourly' ? '120' : '650'}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-slate-400">
                    /{rateType === 'hourly' ? 'hour' : 'day'}
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-1">
                  {(rateType === 'hourly' ? ['80', '120', '180', '250'] : ['400', '650', '850', '1200']).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleRateNumberChange(preset)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
                        rateNumber === preset
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      R{preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Online Seekers List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-3 flex-1">
          
          {/* User's Own Seeker Card (When Online) */}
          {isUserOnline && (
            <div className="p-4 bg-gradient-to-r from-sky-50 via-indigo-50 to-emerald-50 dark:from-slate-800 dark:to-slate-850 rounded-2xl border-2 border-emerald-500 shadow-md flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  YOU (Online • Available For Hire)
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {currentFormattedRate}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500 shadow"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      {userName} <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                    </p>
                    <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">{userTrade}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-sky-500" /> Your Location (0.0 mi)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" /> 5.0 (You)
                  </span>
                  
                  {/* Simulate Client Hiring User to test the destination navigation */}
                  <button
                    type="button"
                    onClick={() => {
                      handleHire({
                        id: 'you',
                        name: userName,
                        trade: userTrade,
                        rating: 5.0,
                        distance: '0.1 mi away',
                        status: 'Online',
                        rateType,
                        rateAmount: currentFormattedRate,
                        lat: userLocation.lat + 0.002,
                        lng: userLocation.lng + 0.002,
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl shadow transition flex items-center gap-1"
                    title="Simulate a client hiring your services"
                  >
                    <Sparkles className="w-3 h-3" /> Test Client Hire
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other Online Seekers */}
          {INITIAL_ONLINE_SEEKERS.map((seeker) => (
            <div
              key={seeker.id}
              className="p-4 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-slate-600 transition shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0">
                  <img
                    src={seeker.avatarUrl}
                    alt={seeker.name}
                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/80 shadow"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="Online" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 truncate">
                    {seeker.name} <ShieldCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  </p>
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">{seeker.trade}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-500 shrink-0" /> {seeker.distance}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px]">
                      <Star className="w-3 h-3 fill-current" /> {seeker.rating} ({seeker.reviewCount})
                    </span>
                  </div>
                </div>
              </div>

              {/* Rate & Hire Seeker Action */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  {seeker.rateAmount}
                </span>

                <button
                  type="button"
                  onClick={() => handleHire(seeker)}
                  className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" /> Hire Seeker
                </button>
              </div>
            </div>
          ))}

        </div>

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Hiring a seeker generates an active service engagement and automatically navigates the seeker to user destination on the map.
          </p>
        </div>

      </div>
    </div>
  );
};
