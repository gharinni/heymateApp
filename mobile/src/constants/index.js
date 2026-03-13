export const DARK_COLORS = {
  primary: '#FF5722', success: '#00C853', danger: '#FF1744',
  warning: '#FFD600', blue: '#2196F3', red: '#EF4444',
  bg: '#0D0D1A', card: '#16213E', surface2: '#1E2D45',
  text: '#F0F0F0', textMuted: '#8892A4', border: '#2A3A5C',
};
export const LIGHT_COLORS = {
  primary: '#FF5722', success: '#00A846', danger: '#FF1744',
  warning: '#F59E0B', blue: '#2196F3', red: '#EF4444',
  bg: '#F5F6FA', card: '#FFFFFF', surface2: '#F0F2F8',
  text: '#1A1A2E', textMuted: '#6B7280', border: '#E2E8F0',
};
export const COLORS = DARK_COLORS;

// Service categories — each has a type: 'shop' | 'person' | 'both'
export const SERVICES = [
  { id: 'food',        icon: '🍔', label: 'Food',        color: '#FF6B35', type: 'shop',   description: 'Restaurants & food delivery nearby' },
  { id: 'grocery',     icon: '🛒', label: 'Grocery',     color: '#4CAF50', type: 'shop',   description: 'Supermarkets & kirana stores' },
  { id: 'transport',   icon: '🚗', label: 'Cab / Auto',  color: '#2196F3', type: 'person', description: 'Cabs, autos & bike rides nearby' },
  { id: 'carpenter',   icon: '🔨', label: 'Carpenter',   color: '#795548', type: 'person', description: 'Furniture repair & woodwork' },
  { id: 'plumber',     icon: '🔧', label: 'Plumber',     color: '#607D8B', type: 'person', description: 'Pipe repair, leaks & fixtures' },
  { id: 'electrician', icon: '⚡', label: 'Electrician', color: '#FFC107', type: 'person', description: 'Wiring, fuse & appliance repair' },
  { id: 'tutor',       icon: '📚', label: 'Tutor',       color: '#00BCD4', type: 'person', description: 'Students & teachers for any subject' },
  { id: 'salon',       icon: '💇', label: 'Salon',       color: '#E91E63', type: 'both',   description: 'Haircut, beauty & grooming' },
  { id: 'hospital',    icon: '🏥', label: 'Hospital',    color: '#F44336', type: 'shop',   description: 'Clinics, hospitals & pharmacies' },
  { id: 'pharmacy',    icon: '💊', label: 'Pharmacy',    color: '#009688', type: 'shop',   description: 'Medical shops & medicine delivery' },
  { id: 'shopping',    icon: '🛍️', label: 'Shopping',    color: '#9C27B0', type: 'shop',   description: 'Clothing, electronics & more' },
  { id: 'laundry',     icon: '👕', label: 'Laundry',     color: '#3F51B5', type: 'both',   description: 'Wash & fold, dry cleaning' },
  { id: 'household',   icon: '🏠', label: 'Home Help',   color: '#FF9800', type: 'person', description: 'Cleaning, cooking & home care' },
  { id: 'stationary',  icon: '✏️', label: 'Stationery',  color: '#607D8B', type: 'shop',   description: 'Books, pens & school supplies' },
  { id: 'events',      icon: '🎉', label: 'Events',      color: '#E91E63', type: 'person', description: 'Decorators, photographers & caterers' },
  { id: 'blood',       icon: '🩸', label: 'Blood',       color: '#D32F2F', type: 'person', description: 'Blood donors in emergency' },
  { id: 'women',       icon: '🛡️', label: 'She-Safe',    color: '#AD1457', type: 'person', description: 'Women safety network' },
  { id: 'fitness',     icon: '💪', label: 'Fitness',     color: '#FF5722', type: 'both',   description: 'Gyms, trainers & yoga classes' },
  { id: 'mechanic',    icon: '🔩', label: 'Mechanic',    color: '#546E7A', type: 'person', description: 'Vehicle repair & servicing' },
  { id: 'petcare',     icon: '🐾', label: 'Pet Care',    color: '#8BC34A', type: 'both',   description: 'Vet, grooming & pet sitting' },
];

export const EMERGENCY_NUMBERS = {
  ambulance: '108', police: '100', fire: '101', women: '1091',
};

// Provider availability status options
export const AVAILABILITY = [
  { id: 'full_time',  label: 'Full Time',   icon: '🟢', sub: 'Available anytime' },
  { id: 'part_time',  label: 'Part Time',   icon: '🟡', sub: 'Specific hours only' },
  { id: 'weekends',   label: 'Weekends',    icon: '📅', sub: 'Sat & Sun only' },
  { id: 'evenings',   label: 'Evenings',    icon: '🌙', sub: 'After 5 PM' },
  { id: 'student',    label: 'Student',     icon: '🎓', sub: 'After college hours' },
  { id: 'on_demand',  label: 'On Demand',   icon: '⚡', sub: 'Accept when free' },
];