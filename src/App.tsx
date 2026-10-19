import React, { useState, useEffect } from 'react';
import { MapView } from './components/MapView';
import { BottomNavBar } from './components/BottomNavBar';
import { ActivationModal, TenantModal, LockedTenantModal, ProfileModal } from './components/Modals';
import { CreateGigModal } from './components/CreateGigModal';
import { SeekersModal } from './components/SeekersModal';
import { GigDetailModal } from './components/GigDetailModal';
import { UserLocation, Gig, SavedIdDoc, TenantReferral } from './types';
import { getPersistentItem, savePersistentItem } from './utils/storage';

export default function App() {
  const [userLocation, setUserLocation] = useState<UserLocation>({
    lat: 51.505,
    lng: -0.09,
    address: 'Central London (GPS Live)',
    isTracking: true,
  });

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'create' | 'activation' | 'tenant' | 'tenant_locked' | 'seekers' | 'profile'>('none');
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [savedIdDoc, setSavedIdDoc] = useState<SavedIdDoc | null>(null);
  const [isTenantUnlocked, setIsTenantUnlocked] = useState(false);
  const [referralBannerMsg, setReferralBannerMsg] = useState<string | null>(null);

  // Restore remembered selfie, ID documents, tenant unlocked state, and handle referral link joins
  useEffect(() => {
    async function initPersistentData() {
      try {
        const storedSelfie = await getPersistentItem<string>('user_selfie');
        if (storedSelfie) {
          setSelfieUrl(storedSelfie);
        }
        const storedDoc = await getPersistentItem<SavedIdDoc>('id_document');
        if (storedDoc) {
          setSavedIdDoc(storedDoc);
        }
        const storedTenantUnlocked = await getPersistentItem<boolean>('is_tenant_unlocked');
        if (storedTenantUnlocked) {
          setIsTenantUnlocked(true);
        }

        // Check if user joined through a Tenant Referral Link (?ref=...)
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref');
        if (refParam) {
          const sessionKey = `joined_via_ref_${refParam}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            const savedRefs = (await getPersistentItem<TenantReferral[]>('tenant_referrals')) || [];
            const randomCode = Math.floor(1000 + Math.random() * 9000);
            const newMember: TenantReferral = {
              id: `ref_link_${Date.now()}`,
              fullName: `Member #${randomCode}`,
              phone: `+27 7${Math.floor(10 + Math.random() * 89)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(1000 + Math.random() * 8999)}`,
              email: `member.${randomCode}@timegig.app`,
              joinedAt: 'Just now via Link',
              plan: 'User Subscription (R29.99/mo)',
              status: 'Active',
              monthlyFee: 'R29.99',
              popSubmitted: true,
              popRef: `POP-LINK-${randomCode}`,
              lastPaymentDate: new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
            };
            const updated = [newMember, ...savedRefs];
            await savePersistentItem('tenant_referrals', updated);
            setReferralBannerMsg(`Joined via Tenant Referral Link (${refParam})! Linked to tenant.`);
            setTimeout(() => setReferralBannerMsg(null), 4000);
          }
        }
      } catch (err) {
        console.warn('Error reading persistent app storage:', err);
      }
    }

    initPersistentData();

    // Always show user location first when app starts
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let address = 'Your Exact GPS Location';
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data?.display_name) {
              address = data.display_name;
            }
          } catch {
            // Keep default
          }

          setUserLocation({
            lat,
            lng,
            accuracy: position.coords.accuracy,
            address,
            isTracking: true,
          });
        },
        (error) => {
          console.warn('Geolocation permission denied or unavailable:', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }, []);

  const handleRefreshLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let address = 'Your Exact GPS Location';
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data?.display_name) {
              address = data.display_name;
            }
          } catch {}

          setUserLocation({
            lat,
            lng,
            accuracy: position.coords.accuracy,
            address,
            isTracking: true,
          });
        },
        (error) => {
          alert('Unable to retrieve exact location. Ensure location permissions are enabled.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const handleHireSeeker = (hiredGig: Gig) => {
    setGigs((prev) => [hiredGig, ...prev]);
    setSelectedGig(hiredGig);
    setActiveModal('none');

    // Lady voice guidance as requested: "when seeker gets hired let the process be the same the map navigate seeker to user destination to complete gig."
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Seeker hired! Navigating to destination from your exact location to complete gig.");
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCreateGig = (newGig: Gig) => {
    setGigs((prev) => [newGig, ...prev]);
  };

  const handleAcceptGig = (gig: Gig) => {
    setGigs((prev) => prev.map((g) => (g.id === gig.id ? { ...g, status: 'accepted' } : g)));
    setSelectedGig((prev) => (prev ? { ...prev, status: 'accepted' } : null));
  };

  const handleCompleteGig = (gigId: string) => {
    setGigs((prev) => prev.filter((g) => g.id !== gigId));
    alert('Gig marked as completed by owner.');
  };

  const handleSaveSelfie = (url: string) => {
    setSelfieUrl(url);
    savePersistentItem('user_selfie', url);
  };

  const handleSaveIdDoc = (doc: SavedIdDoc) => {
    setSavedIdDoc(doc);
    savePersistentItem('id_document', doc);
  };

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-slate-950 font-sans select-none flex flex-col">
      
      {/* Referral Link Join Banner */}
      {referralBannerMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top">
          <span>{referralBannerMsg}</span>
        </div>
      )}

      {/* Map View */}
      <div className="absolute inset-0">
        <MapView
          userLocation={userLocation}
          gigs={gigs}
          selectedGig={selectedGig}
          onSelectGig={(gig) => setSelectedGig(gig)}
          onRefreshLocation={handleRefreshLocation}
          onUpdateLocation={(loc) => setUserLocation(loc)}
          selfieUrl={selfieUrl}
        />
      </div>

      {/* Docked Smaller Bottom Menu Bar */}
      <BottomNavBar
        isTenantUnlocked={isTenantUnlocked}
        onOpenCreateGig={() => setActiveModal('create')}
        onOpenActivation={() => setActiveModal('activation')}
        onOpenTenant={() => {
          if (isTenantUnlocked) {
            setActiveModal('tenant');
          } else {
            setActiveModal('tenant_locked');
          }
        }}
        onOpenSeekers={() => setActiveModal('seekers')}
        onOpenProfile={() => setActiveModal('profile')}
      />

      {/* Modals */}
      <CreateGigModal
        isOpen={activeModal === 'create'}
        onClose={() => setActiveModal('none')}
        userLocation={userLocation}
        onCreateGig={handleCreateGig}
      />

      <SeekersModal
        isOpen={activeModal === 'seekers'}
        onClose={() => setActiveModal('none')}
        userLocation={userLocation}
        selfieUrl={selfieUrl}
        onHireSeeker={handleHireSeeker}
      />

      <ActivationModal
        isOpen={activeModal === 'activation'}
        onClose={() => setActiveModal('none')}
        onSaveSelfie={handleSaveSelfie}
        onSaveIdDoc={handleSaveIdDoc}
        onUnlockTenant={(unlocked) => setIsTenantUnlocked(unlocked)}
      />

      <LockedTenantModal
        isOpen={activeModal === 'tenant_locked'}
        onClose={() => setActiveModal('none')}
        onGoToActivation={() => setActiveModal('activation')}
        onUnlockTenant={() => {
          setIsTenantUnlocked(true);
          savePersistentItem('is_tenant_unlocked', true);
          savePersistentItem('user_subscription_plan', 'tenant');
          setActiveModal('tenant');
        }}
      />

      <TenantModal
        isOpen={activeModal === 'tenant'}
        onClose={() => setActiveModal('none')}
      />

      <ProfileModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal('none')}
        userLocation={userLocation}
        selfieUrl={selfieUrl}
        savedIdDoc={savedIdDoc}
      />

      <GigDetailModal
        gig={selectedGig}
        onClose={() => setSelectedGig(null)}
        onAcceptGig={handleAcceptGig}
        onCompleteGig={handleCompleteGig}
        isOwner={true}
      />

    </div>
  );
}
