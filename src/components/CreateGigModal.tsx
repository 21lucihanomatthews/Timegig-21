import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, MapPin, DollarSign, Clock, Loader2 } from 'lucide-react';
import { UserLocation, Gig } from '../types';

interface CreateGigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: UserLocation;
  onCreateGig: (newGig: Gig) => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export const CreateGigModal: React.FC<CreateGigModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onCreateGig,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Gig['category']>('Delivery');
  const [pay, setPay] = useState('R500');
  const [duration, setDuration] = useState('1 hour');
  const [description, setDescription] = useState('');
  const [locationMode, setLocationMode] = useState<'auto' | 'manual'>('auto');
  const [manualLocation, setManualLocation] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Debounced autocomplete suggestions from Nominatim
  useEffect(() => {
    if (locationMode !== 'manual' || !manualLocation.trim() || manualLocation.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=5`
        );
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [manualLocation, locationMode]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let targetLat = selectedCoords ? selectedCoords.lat : userLocation.lat;
    let targetLng = selectedCoords ? selectedCoords.lng : userLocation.lng;

    const formattedPay = pay.toUpperCase().startsWith('R') ? pay : `R${pay.replace(/[^0-9]/g, '')}`;

    const newGig: Gig = {
      id: `gig-${Date.now()}`,
      title,
      category,
      pay: formattedPay,
      distance: '0.1 mi',
      lat: targetLat + (Math.random() - 0.5) * 0.002,
      lng: targetLng + (Math.random() - 0.5) * 0.002,
      description: description || 'Task posted by tenant workspace.',
      duration,
      clientName: 'Current Tenant',
      clientRating: 5.0,
      status: 'open',
    };

    onCreateGig(newGig);
    onClose();
    setTitle('');
    setDescription('');
    setManualLocation('');
    setSuggestions([]);
    setSelectedCoords(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Gig Post</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">South African Rands (ZAR) • Live Autocomplete</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gig Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Express Delivery in Sandton"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="Delivery">Delivery</option>
                <option value="Tech">Tech</option>
                <option value="Creative">Creative</option>
                <option value="Services">Services</option>
                <option value="Pet Care">Pet Care</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payout (ZAR)</label>
              <input
                type="text"
                required
                placeholder="R500"
                value={pay}
                onChange={(e) => setPay(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Location Mode Toggle */}
          <div className="flex flex-col gap-2 relative">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Gig Location</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocationMode('auto');
                  setSuggestions([]);
                  setSelectedCoords(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  locationMode === 'auto'
                    ? 'bg-sky-500 text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Automatic (GPS)
              </button>
              <button
                type="button"
                onClick={() => setLocationMode('manual')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                  locationMode === 'manual'
                    ? 'bg-sky-500 text-white shadow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Set Manually
              </button>
            </div>

            {locationMode === 'manual' && (
              <div className="relative mt-1">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Type street, suburb, or city (e.g. Rosebank, Cape Town)..."
                    value={manualLocation}
                    onChange={(e) => {
                      setManualLocation(e.target.value);
                      setSelectedCoords(null);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white pr-10"
                  />
                  {isLoadingSuggestions && (
                    <Loader2 className="absolute right-3 w-4 h-4 text-sky-500 animate-spin" />
                  )}
                </div>

                {/* Autocomplete Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto z-50">
                    {suggestions.map((s, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setManualLocation(s.display_name);
                          setSelectedCoords({ lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
                          setSuggestions([]);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700/50 last:border-none flex items-center gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="line-clamp-1">{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration & Description</label>
            <input
              type="text"
              placeholder="Duration (e.g. 2 hours)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white mb-2"
            />
            <textarea
              rows={2}
              placeholder="Full description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-xl transition"
          >
            Publish Gig Post (ZAR)
          </button>
        </form>

      </div>
    </div>
  );
};
