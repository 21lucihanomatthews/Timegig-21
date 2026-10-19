import { Gig } from '../types';

export const generateDefaultGigs = (baseLat: number, baseLng: number): Gig[] => [
  {
    id: 'gig-1',
    title: 'Urgent Document Courier to Financial District',
    category: 'Delivery',
    pay: '$65',
    distance: '0.4 mi',
    lat: baseLat + 0.004,
    lng: baseLng + 0.005,
    description: 'Need secure and rapid delivery of signed property deeds to legal offices. Must have reliable transport.',
    duration: '45 mins',
    clientName: 'Sterling Legal Group',
    clientRating: 4.9,
    status: 'open'
  },
  {
    id: 'gig-2',
    title: 'MacBook Pro Display & Port Diagnostic',
    category: 'Tech',
    pay: '$120',
    distance: '0.8 mi',
    lat: baseLat - 0.006,
    lng: baseLng + 0.003,
    description: 'On-site diagnostic for M2 MacBook Pro experiencing intermittent external display dropouts. Technical expertise required.',
    duration: '1.5 hours',
    clientName: 'Elena Rostova',
    clientRating: 5.0,
    status: 'open'
  },
  {
    id: 'gig-3',
    title: 'Drone Aerial Photography for Real Estate Listing',
    category: 'Creative',
    pay: '$180',
    distance: '1.2 mi',
    lat: baseLat + 0.008,
    lng: baseLng - 0.006,
    description: 'Capture 4K drone video and HDR photos of a luxury 3-bedroom townhouse for afternoon sunset listing.',
    duration: '2 hours',
    clientName: 'Apex Urban Properties',
    clientRating: 4.8,
    status: 'open'
  },
  {
    id: 'gig-4',
    title: 'Golden Retriever Afternoon Walk & Park Play',
    category: 'Pet Care',
    pay: '$35',
    distance: '0.3 mi',
    lat: baseLat - 0.003,
    lng: baseLng - 0.004,
    description: 'Friendly 2-year-old golden retriever needs a 45-minute energetic walk in the neighborhood park.',
    duration: '45 mins',
    clientName: 'Marcus Chen',
    clientRating: 4.9,
    status: 'open'
  },
  {
    id: 'gig-5',
    title: 'Emergency Catering Setup & Server Assistance',
    category: 'Urgent',
    pay: '$95',
    distance: '1.5 mi',
    lat: baseLat + 0.012,
    lng: baseLng + 0.009,
    description: 'Last-minute corporate lunch setup for 35 executives. Assist chef with plating and beverage station management.',
    duration: '3 hours',
    clientName: 'Bistro Gourmand',
    clientRating: 4.7,
    status: 'open'
  },
  {
    id: 'gig-6',
    title: 'Smart Home Hub & Wi-Fi Mesh Configuration',
    category: 'Services',
    pay: '$110',
    distance: '0.9 mi',
    lat: baseLat - 0.009,
    lng: baseLng - 0.008,
    description: 'Install and configure a 3-node Wi-Fi mesh router system and connect 12 smart home lighting accessories.',
    duration: '2 hours',
    clientName: 'Sarah Jenkins',
    clientRating: 5.0,
    status: 'open'
  }
];
