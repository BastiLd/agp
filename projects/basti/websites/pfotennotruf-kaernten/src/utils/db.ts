import { Veterinarian, VetInquiry, INITIAL_VETS, VetStatus } from '../data/mockVets';

const VETS_KEY = 'pfotennotruf_vets';
const INQUIRIES_KEY = 'pfotennotruf_inquiries';

/**
 * Utility to fetch vets from localStorage or initialize with defaults.
 */
export function getStoredVets(): Veterinarian[] {
  if (typeof window === 'undefined') return INITIAL_VETS;
  
  const stored = localStorage.getItem(VETS_KEY);
  if (!stored) {
    localStorage.setItem(VETS_KEY, JSON.stringify(INITIAL_VETS));
    return INITIAL_VETS;
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse stored veterinarians, resetting to defaults.', e);
    return INITIAL_VETS;
  }
}

/**
 * Saves the list of vets to localStorage.
 */
export function saveStoredVets(vets: Veterinarian[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VETS_KEY, JSON.stringify(vets));
}

/**
 * Updates a veterinarian's status and timestamp.
 */
export function updateVetStatus(vetId: string, status: VetStatus): Veterinarian[] {
  const vets = getStoredVets();
  const updated = vets.map(v => {
    if (v.id === vetId) {
      return {
        ...v,
        status,
        lastConfirmed: new Date().toISOString()
      };
    }
    return v;
  });
  saveStoredVets(updated);
  return updated;
}

/**
 * Updates a veterinarian's profile data.
 */
export function updateVetProfile(
  vetId: string, 
  data: Partial<Pick<Veterinarian, 'openingHours' | 'emergencyInfo' | 'species' | 'services'>>
): Veterinarian[] {
  const vets = getStoredVets();
  const updated = vets.map(v => {
    if (v.id === vetId) {
      return {
        ...v,
        ...data
      };
    }
    return v;
  });
  saveStoredVets(updated);
  return updated;
}

/**
 * Utility to fetch inquiries from localStorage.
 */
export function getStoredInquiries(): VetInquiry[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(INQUIRIES_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse inquiries.', e);
    return [];
  }
}

/**
 * Submits a new client request.
 */
export function addInquiry(inquiry: Omit<VetInquiry, 'id' | 'timestamp'>): VetInquiry {
  const inquiries = getStoredInquiries();
  const newInquiry: VetInquiry = {
    ...inquiry,
    id: `inq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  
  inquiries.push(newInquiry);
  if (typeof window !== 'undefined') {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(inquiries));
  }
  return newInquiry;
}

/**
 * Returns all requests submitted to a specific veterinarian clinic.
 */
export function getInquiriesForVet(vetId: string): VetInquiry[] {
  const all = getStoredInquiries();
  return all.filter(inq => inq.vetId === vetId);
}
