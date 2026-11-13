import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  User, 
  Role, 
  Donation, 
  DonationClaim, 
  DeliveryTask, 
  AdvanceFoodRequest,
  AppNotification 
} from '@/types/domain';
import { apiClient } from '@/services/apiClient';

// Import realistic assets matching simple-ride-scout prototype
import biryani from '@/assets/food-biryani.jpg';
import wedding from '@/assets/food-wedding.jpg';
import bread from '@/assets/food-bread.jpg';

export const DEMO_USERS: Record<Role, User> = {
  restaurant: {
    id: 'u-rest-1',
    name: 'Sarah Jenkins',
    email: 'manager@greenbistro.com',
    role: 'restaurant',
    status: 'ACTIVE',
    organizationId: 'org-rest-1',
    organizationType: 'RESTAURANT',
    organizationName: 'Spice Route Kitchen',
    isVerified: true,
  },
  event: {
    id: 'u-event-1',
    name: 'Ananya & Rahul Wedding',
    email: 'events@grandpalace.org',
    role: 'event',
    status: 'ACTIVE',
    organizationId: 'org-event-1',
    organizationType: 'EVENT_ORGANIZER',
    organizationName: 'Grand Palace Hall',
    isVerified: true,
  },
  ngo: {
    id: 'u-ngo-1',
    name: 'Helping Hands Shelter',
    email: 'coordinator@helpinghands.org',
    role: 'ngo',
    status: 'ACTIVE',
    organizationId: 'org-ngo-1',
    organizationType: 'NGO',
    organizationName: 'Helping Hands Trust',
    isVerified: true,
  },
  volunteer: {
    id: 'u-vol-1',
    name: 'Arjun Nair',
    email: 'arjun@communitydriver.org',
    role: 'volunteer',
    status: 'ACTIVE',
    volunteerProfileId: 'vol-prof-1',
    isVerified: true,
  },
  public: {
    id: 'u-pub-1',
    name: 'Meera (Neighbourhood)',
    email: 'meera@localcitizen.org',
    role: 'public',
    status: 'ACTIVE',
  },
};

const SEED_DONATIONS: Donation[] = [
  {
    id: 'd-1',
    organizationId: 'org-rest-1',
    providerName: 'Spice Route Kitchen',
    providerType: 'RESTAURANT',
    isVerified: true,
    foodName: 'Fresh Chicken Biryani & Salan',
    description: 'High-quality freshly prepared biryani from dinner service. Packed in food-grade thermal containers.',
    category: 'MEALS',
    foodType: 'NON_VEG',
    totalQuantity: 100,
    remainingQuantity: 60,
    unit: 'MEALS',
    preparedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    availableFrom: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    collectionDeadline: new Date(Date.now() + 3.5 * 3600 * 1000).toISOString(),
    storageType: 'HOT',
    pickupPointId: 'pp-1',
    pickupAddress: 'MG Road Central, Near Metro Gate 2',
    pickupPointName: 'Rear Kitchen Dispatch Bay',
    latitude: 9.9816,
    longitude: 76.2799,
    distanceKm: 1.2,
    safetyDeclared: true,
    status: 'AVAILABLE',
    allowPublicPickup: false,
    allergens: ['Dairy'],
    imageUrls: [biryani],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'd-2',
    organizationId: 'org-event-1',
    providerName: 'Grand Palace Wedding Hall',
    providerType: 'EVENT_ORGANIZER',
    isVerified: true,
    foodName: 'Wedding Buffet Surplus — Veg & Non-Veg Assortment',
    description: 'Surplus wedding feast including ghee rice, paneer butter masala, and vegetable cutlets untouched from heated buffet stations.',
    category: 'MEALS',
    foodType: 'VEG',
    totalQuantity: 250,
    remainingQuantity: 150,
    unit: 'MEALS',
    preparedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    availableFrom: new Date().toISOString(),
    collectionDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    storageType: 'HOT',
    pickupPointId: 'pp-2',
    pickupAddress: 'Grand Palace Hall, Bypass Junction, Edappally',
    pickupPointName: 'Catering Service Gate',
    latitude: 10.0236,
    longitude: 76.3116,
    distanceKm: 3.8,
    safetyDeclared: true,
    status: 'AVAILABLE',
    allowPublicPickup: false,
    eventName: 'Ananya & Rahul Wedding Reception',
    eventType: 'Wedding',
    eventDate: 'Today',
    allergens: ['Dairy', 'Nuts', 'Gluten'],
    imageUrls: [wedding],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'd-3',
    organizationId: 'org-rest-2',
    providerName: 'Daily Crust Artisan Bakery',
    providerType: 'BAKERY',
    isVerified: true,
    foodName: 'Whole Wheat Breads, Buns & Tea Pastries',
    description: 'Fresh artisanal bread baked this morning. Sealed in clean bags. Perfect for community distribution.',
    category: 'BREAD',
    foodType: 'VEG',
    totalQuantity: 60,
    remainingQuantity: 60,
    unit: 'PACKETS',
    preparedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    availableFrom: new Date().toISOString(),
    collectionDeadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    storageType: 'AMBIENT',
    pickupPointId: 'pp-3',
    pickupAddress: 'Main Avenue, Panampilly Nagar',
    pickupPointName: 'Bakery Front Counter',
    latitude: 9.9624,
    longitude: 76.2942,
    distanceKm: 0.8,
    safetyDeclared: true,
    status: 'AVAILABLE',
    allowPublicPickup: true,
    publicInstructions: 'Open to neighbours and community members. Please bring your own carry bag.',
    allergens: ['Gluten', 'Sesame'],
    imageUrls: [bread],
    createdAt: new Date().toISOString(),
  },
];

const SEED_CLAIMS: DonationClaim[] = [
  {
    id: 'claim-1',
    donationId: 'd-1',
    ngoId: 'org-ngo-1',
    ngoName: 'Helping Hands Trust',
    requestedQuantity: 40,
    approvedQuantity: 40,
    pickupMode: 'VOLUNTEER',
    deliveryLocationId: 'loc-ngo-1',
    status: 'APPROVED',
    requestedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    qrCodeToken: 'QR-HANDOVER-SECURE-98214',
  },
  {
    id: 'claim-2',
    donationId: 'd-2',
    ngoId: 'org-ngo-1',
    ngoName: 'Helping Hands Trust',
    requestedQuantity: 100,
    pickupMode: 'VOLUNTEER',
    deliveryLocationId: 'loc-ngo-1',
    status: 'PENDING',
    requestedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

const SEED_DELIVERIES: DeliveryTask[] = [
  {
    id: 'del-1',
    donationClaimId: 'claim-1',
    donationId: 'd-1',
    donationTitle: 'Fresh Chicken Biryani & Salan',
    providerName: 'Spice Route Kitchen',
    providerAddress: 'MG Road Central, Near Metro Gate 2',
    providerPhone: '+91 98470 12345',
    ngoName: 'Helping Hands Shelter',
    deliveryAddress: 'Shelter Block B, Market Road, Ernakulam',
    ngoPhone: '+91 94471 67890',
    quantity: 40,
    unit: 'MEALS',
    pickupMode: 'VOLUNTEER',
    volunteerId: 'u-vol-1',
    volunteerName: 'Arjun Nair',
    status: 'IN_TRANSIT',
    assignedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    acceptedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    pickedUpAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    currentLatitude: 9.9750,
    currentLongitude: 76.2850,
  },
  {
    id: 'del-2',
    donationClaimId: 'claim-open-1',
    donationId: 'd-2',
    donationTitle: 'Wedding Buffet Surplus — 50 kg Veg Feast',
    providerName: 'Grand Palace Wedding Hall',
    providerAddress: 'Bypass Junction, Edappally',
    providerPhone: '+91 98950 54321',
    ngoName: 'Care & Hope Community Kitchen',
    deliveryAddress: 'Community Center, Kalamassery',
    ngoPhone: '+91 94960 99887',
    quantity: 50,
    unit: 'MEALS',
    pickupMode: 'VOLUNTEER',
    status: 'PENDING',
    assignedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

const SEED_ADVANCE_REQUESTS: AdvanceFoodRequest[] = [
  {
    id: 'req-1',
    ngoId: 'org-ngo-1',
    ngoName: 'Helping Hands Trust',
    foodCategory: 'MEALS',
    foodType: 'VEG',
    requiredQuantity: 120,
    unit: 'MEALS',
    requiredDate: 'Tomorrow',
    requiredBefore: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    deliveryLocationId: 'loc-ngo-1',
    deliveryAddress: 'Shelter Block B, Market Road, Ernakulam',
    priority: 'HIGH',
    notes: 'Urgent evening meal service for 120 senior citizens at community shelter.',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  },
];

interface AppState {
  user: User | null;
  donations: Donation[];
  claims: DonationClaim[];
  deliveries: DeliveryTask[];
  advanceRequests: AdvanceFoodRequest[];
  notifications: AppNotification[];
  isOnline: boolean;
}

interface AppContextType extends AppState {
  setUser: (user: User | null) => void;
  signInRole: (role: Role) => void;
  signOut: () => void;
  createDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'remainingQuantity'>) => Promise<Donation>;
  updateDonation: (id: string, updates: Partial<Donation>) => Promise<void>;
  submitClaim: (claim: Omit<DonationClaim, 'id' | 'requestedAt' | 'status'>) => Promise<DonationClaim>;
  reviewClaim: (claimId: string, approved: boolean, approvedQuantity?: number, reason?: string) => Promise<void>;
  acceptDelivery: (deliveryId: string) => Promise<void>;
  confirmPickup: (deliveryId: string, code: string) => Promise<void>;
  confirmDelivery: (deliveryId: string, code: string) => Promise<void>;
  confirmDirectHandover: (claimId: string, code: string) => Promise<void>;
  createAdvanceRequest: (req: Omit<AdvanceFoodRequest, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  markNotificationRead: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);
const STORAGE_KEY = 'surplus_rescue_store_v1';

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_USERS.ngo); // default role view
  const [donations, setDonations] = useState<Donation[]>(SEED_DONATIONS);
  const [claims, setClaims] = useState<DonationClaim[]>(SEED_CLAIMS);
  const [deliveries, setDeliveries] = useState<DeliveryTask[]>(SEED_DELIVERIES);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceFoodRequest[]>(SEED_ADVANCE_REQUESTS);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      userId: 'u-ngo-1',
      title: 'Claim Approved!',
      message: 'Spice Route Kitchen approved your request for 40 meals. Volunteer assigned.',
      type: 'CLAIM',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Initialize network status listener & storage recovery
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.user) setUser(parsed.user);
        if (parsed.donations) setDonations(parsed.donations);
        if (parsed.claims) setClaims(parsed.claims);
        if (parsed.deliveries) setDeliveries(parsed.deliveries);
        if (parsed.advanceRequests) setAdvanceRequests(parsed.advanceRequests);
      }
    } catch {}

    // Preload CSRF token on app mount
    apiClient.getCsrfToken();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save changes to localStorage for resilience
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, donations, claims, deliveries, advanceRequests })
      );
    } catch {}
  }, [user, donations, claims, deliveries, advanceRequests]);

  const signInRole = (role: Role) => {
    setUser(DEMO_USERS[role] || null);
  };

  const signOut = () => {
    setUser(null);
  };

  const createDonation = async (
    data: Omit<Donation, 'id' | 'createdAt' | 'remainingQuantity'>
  ): Promise<Donation> => {
    if (!isOnline) {
      throw new Error('Cannot publish donation while offline. Please reconnect.');
    }
    const newDonation: Donation = {
      ...data,
      id: `d-${Date.now()}`,
      remainingQuantity: data.totalQuantity,
      createdAt: new Date().toISOString(),
    };
    setDonations((prev) => [newDonation, ...prev]);

    // Add alert notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        userId: user?.id || 'sys',
        title: 'Donation Published',
        message: `${newDonation.foodName} (${newDonation.totalQuantity} ${newDonation.unit}) is now visible to verified NGOs.`,
        type: 'DONATION',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    return newDonation;
  };

  const updateDonation = async (id: string, updates: Partial<Donation>) => {
    setDonations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  const submitClaim = async (
    data: Omit<DonationClaim, 'id' | 'requestedAt' | 'status'>
  ): Promise<DonationClaim> => {
    if (!isOnline) {
      throw new Error('Cannot submit claim while offline.');
    }
    const targetDonation = donations.find((d) => d.id === data.donationId);
    if (!targetDonation) throw new Error('Donation not found.');
    if (data.requestedQuantity > targetDonation.remainingQuantity) {
      throw new Error(
        `Requested quantity (${data.requestedQuantity}) exceeds available remaining surplus (${targetDonation.remainingQuantity}).`
      );
    }

    const newClaim: DonationClaim = {
      ...data,
      id: `claim-${Date.now()}`,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    setClaims((prev) => [newClaim, ...prev]);
    return newClaim;
  };

  const reviewClaim = async (
    claimId: string,
    approved: boolean,
    approvedQuantity?: number,
    reason?: string
  ) => {
    if (!isOnline) throw new Error('Cannot review claim while offline.');

    const claim = claims.find((c) => c.id === claimId);
    if (!claim) throw new Error('Claim not found.');
    const donation = donations.find((d) => d.id === claim.donationId);
    if (!donation) throw new Error('Associated donation not found.');

    const actualAllocated = approved ? approvedQuantity ?? claim.requestedQuantity : 0;

    if (approved && actualAllocated > donation.remainingQuantity) {
      throw new Error(
        `Allocated quantity (${actualAllocated}) exceeds available surplus (${donation.remainingQuantity}).`
      );
    }

    // Update claim
    const updatedClaim: DonationClaim = {
      ...claim,
      status: approved ? 'APPROVED' : 'REJECTED',
      approvedQuantity: actualAllocated,
      rejectionReason: approved ? undefined : reason,
      reviewedAt: new Date().toISOString(),
      qrCodeToken: approved ? `QR-CODE-${claim.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    };

    setClaims((prev) => prev.map((c) => (c.id === claimId ? updatedClaim : c)));

    if (approved) {
      // Deduct from donation remaining quantity
      const newRemaining = donation.remainingQuantity - actualAllocated;
      setDonations((prev) =>
        prev.map((d) =>
          d.id === donation.id
            ? {
                ...d,
                remainingQuantity: newRemaining,
                status: newRemaining === 0 ? 'CLOSED' : d.status,
              }
            : d
        )
      );

      // Create a delivery task if mode is VOLUNTEER
      if (claim.pickupMode === 'VOLUNTEER') {
        const newTask: DeliveryTask = {
          id: `del-${Date.now()}`,
          donationClaimId: claim.id,
          donationId: donation.id,
          donationTitle: donation.foodName,
          providerName: donation.providerName,
          providerAddress: donation.pickupAddress,
          ngoName: claim.ngoName,
          deliveryAddress: 'Shelter Address / Designated Drop-off',
          quantity: actualAllocated,
          unit: donation.unit,
          pickupMode: 'VOLUNTEER',
          status: 'PENDING',
          assignedAt: new Date().toISOString(),
        };
        setDeliveries((prev) => [newTask, ...prev]);
      }
    }
  };

  const acceptDelivery = async (deliveryId: string) => {
    if (!isOnline) throw new Error('Network offline.');
    setDeliveries((prev) =>
      prev.map((del) =>
        del.id === deliveryId
          ? {
              ...del,
              status: 'ACCEPTED',
              acceptedAt: new Date().toISOString(),
              volunteerId: user?.id,
              volunteerName: user?.name,
            }
          : del
      )
    );
  };

  const confirmPickup = async (deliveryId: string, _code: string) => {
    setDeliveries((prev) =>
      prev.map((del) =>
        del.id === deliveryId
          ? {
              ...del,
              status: 'IN_TRANSIT',
              pickedUpAt: new Date().toISOString(),
            }
          : del
      )
    );
  };

  const confirmDelivery = async (deliveryId: string, _code: string) => {
    setDeliveries((prev) =>
      prev.map((del) =>
        del.id === deliveryId
          ? {
              ...del,
              status: 'DELIVERED',
              deliveredAt: new Date().toISOString(),
            }
          : del
      )
    );
  };

  const confirmDirectHandover = async (claimId: string, _code: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: 'COMPLETED' } : c))
    );
  };

  const createAdvanceRequest = async (
    req: Omit<AdvanceFoodRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    const newReq: AdvanceFoodRequest = {
      ...req,
      id: `req-${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    setAdvanceRequests((prev) => [newReq, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <AppContext.Provider
      value={{
        user,
        donations,
        claims,
        deliveries,
        advanceRequests,
        notifications,
        isOnline,
        setUser,
        signInRole,
        signOut,
        createDonation,
        updateDonation,
        submitClaim,
        reviewClaim,
        acceptDelivery,
        confirmPickup,
        confirmDelivery,
        confirmDirectHandover,
        createAdvanceRequest,
        markNotificationRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
