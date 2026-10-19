export interface Hotspot {
  name: string;
  country: string;
  lat: number;
  lng: number;
  description: string;
}

export const SURPRISE_HOTSPOTS: Hotspot[] = [
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, description: 'Neon-lit tech gigs & express deliveries in Shibuya' },
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, description: 'Luxury fashion photography & artistic freelance tasks' },
  { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060, description: 'Fast-paced financial courier & urgent tech support' },
  { name: 'Bali', country: 'Indonesia', lat: -8.409518, lng: 115.188919, description: 'Digital nomad drone cinematography & content creation' },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426, description: 'Scenic wilderness expeditions & tour guide assistant' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093, description: 'Harbor-side events & coastal pet care gigs' },
];
