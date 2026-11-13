import React, { useState } from 'react';
import { PartyPopper, Calendar, MapPin, Clock, Plus, CheckCircle, QrCode } from 'lucide-react';
import { AppShell, FoodCard, Modal, btn, inputStyle, QRCodeDisplay } from '@/components/app/kit';
import { useApp } from '@/context/AppContext';
import { UnitType, FoodCategory, FoodType, StorageType, Donation } from '@/types/domain';

type Tab = 'events' | 'new' | 'requests';

export const EventDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('events');
  const { user, donations, claims, createDonation, reviewClaim } = useApp();

  const [eventName, setEventName] = useState('Ananya & Rahul Wedding Reception');
  const [eventType, setEventType] = useState('Wedding Feast');
  const [foodName, setFoodName] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(150);
  const [unit, setUnit] = useState<UnitType>('MEALS');
  const [pickupAddress, setPickupAddress] = useState('Grand Palace Hall, Bypass Junction, Edappally');
  const [contactPerson, setContactPerson] = useState('Ananya Menon (+91 98470 54321)');
  const [collectionDeadlineHours, setCollectionDeadlineHours] = useState(4);
  const [safetyDeclared, setSafetyDeclared] = useState(true);
  const [qrToken, setQrToken] = useState<string | null>(null);

  const eventDonations = donations.filter((d) => d.providerType === 'EVENT_ORGANIZER');
  const pendingClaims = claims.filter((c) => {
    const donation = donations.find((d) => d.id === c.donationId);
    return donation?.providerType === 'EVENT_ORGANIZER' && c.status === 'PENDING';
  });

  const handlePublishEventFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDonation({
        organizationId: user?.organizationId || 'org-event-1',
        providerName: user?.organizationName || 'Grand Palace Wedding Hall',
        providerType: 'EVENT_ORGANIZER',
        isVerified: true,
        foodName,
        category: 'MEALS',
        foodType: 'VEG',
        totalQuantity,
        unit,
        preparedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        availableFrom: new Date().toISOString(),
        collectionDeadline: new Date(Date.now() + collectionDeadlineHours * 3600 * 1000).toISOString(),
        storageType: 'HOT',
        pickupPointId: 'pp-event-1',
        pickupAddress: `${pickupAddress} (Contact: ${contactPerson})`,
        pickupPointName: 'Catering Service Gate',
        latitude: 10.0236,
        longitude: 76.3116,
        safetyDeclared,
        status: 'AVAILABLE',
        allowPublicPickup: false,
        eventName,
        eventType,
        eventDate: 'Today',
        allergens: ['Dairy', 'Gluten'],
        imageUrls: [],
      });
      setFoodName('');
      setTab('events');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <AppShell
      role="event"
      tab={tab}
      onTab={setTab}
      tabs={[
        { id: 'events', label: 'Event Surplus Listings', icon: <PartyPopper className="w-4 h-4" /> },
        { id: 'new', label: 'Publish Event Food', icon: <Plus className="w-4 h-4" /> },
        { id: 'requests', label: `NGO Claims (${pendingClaims.length})`, icon: <CheckCircle className="w-4 h-4" /> },
      ]}
    >
      {tab === 'events' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Event & Function Food Surplus</h2>
              <p className="text-xs text-muted-foreground">
                Weddings, conventions, banquets and public functions sharing untouched fresh food.
              </p>
            </div>
            <button onClick={() => setTab('new')} className={btn.primary}>
              <Plus className="w-4 h-4" /> List Event Surplus
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventDonations.map((d) => (
              <FoodCard
                key={d.id}
                d={d}
                footer={
                  <div className="flex items-center justify-between border-t border-border/80 pt-3 text-xs">
                    <span className="font-semibold text-muted-foreground">
                      Status: <strong className="text-event">{d.status}</strong>
                    </span>
                    <button
                      onClick={() => setQrToken(`QR-EVENT-HANDOVER-${d.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-event-soft text-event hover:opacity-85 font-bold transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Handoff QR
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'new' && (
        <div className="max-w-2xl mx-auto bg-card border border-border p-8 rounded-3xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-event-soft text-event flex items-center justify-center">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Publish Event Leftover Food</h2>
              <p className="text-xs text-muted-foreground">
                Rapidly mobilize food from weddings, parties and corporate galas to nearby shelters.
              </p>
            </div>
          </div>

          <form onSubmit={handlePublishEventFood} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className={inputStyle}
                  placeholder="e.g. Ananya & Rahul Wedding"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Event Type</label>
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} className={inputStyle}>
                  <option value="Wedding Feast">Wedding Feast</option>
                  <option value="Conference Banquet">Conference / Seminar</option>
                  <option value="Birthday Gathering">Birthday / Anniversary</option>
                  <option value="Corporate Dinner">Corporate Gathering</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Food Items Description</label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className={inputStyle}
                placeholder="e.g. 150 Plates Veg Ghee Rice, Paneer Curry & Halwa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Available Quantity</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(Number(e.target.value))}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Unit</label>
                <select value={unit} onChange={(e) => setUnit(e.target.value as UnitType)} className={inputStyle}>
                  <option value="MEALS">Plates / Meals</option>
                  <option value="KG">Kilograms (kg)</option>
                  <option value="PACKETS">Boxes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Venue Pickup Address</label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">On-Site Contact</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Collection Deadline</label>
                <select
                  value={collectionDeadlineHours}
                  onChange={(e) => setCollectionDeadlineHours(Number(e.target.value))}
                  className={inputStyle}
                >
                  <option value={2}>Within 2 hours (Urgent)</option>
                  <option value={4}>Within 4 hours</option>
                  <option value={6}>Within 6 hours</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <label className="flex items-center gap-3 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyDeclared}
                  onChange={(e) => setSafetyDeclared(e.target.checked)}
                  className="rounded w-4 h-4 text-primary"
                />
                <span>I confirm this event food was kept in clean warmers/covered containers and is safe to eat.</span>
              </label>
            </div>

            <button type="submit" disabled={!safetyDeclared} className={`${btn.primary} w-full mt-4`}>
              Broadcast Event Surplus Food
            </button>
          </form>
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">NGO Claims for Event Food</h2>
          {pendingClaims.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-accent" />
              <p className="font-bold">No pending claims</p>
              <p className="text-xs">NGO claims will appear here as soon as submitted.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingClaims.map((claim) => (
                <div key={claim.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-base">{claim.ngoName}</h3>
                    <p className="text-xs text-muted-foreground">
                      Requested: <strong>{claim.requestedQuantity}</strong> meals • Mode: <strong>{claim.pickupMode}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => await reviewClaim(claim.id, true, claim.requestedQuantity)}
                      className={btn.primary}
                    >
                      Approve Request
                    </button>
                    <button
                      onClick={async () => await reviewClaim(claim.id, false, 0, 'Unavailable')}
                      className={btn.danger}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code Handoff Dialog */}
      <Modal open={!!qrToken} onClose={() => setQrToken(null)} title="Event Handoff QR Code">
        {qrToken && (
          <QRCodeDisplay
            token={qrToken}
            title="Present to NGO or Volunteer Courier"
            subtitle="Scanning this code completes the event surplus pickup verification."
          />
        )}
      </Modal>
    </AppShell>
  );
};
