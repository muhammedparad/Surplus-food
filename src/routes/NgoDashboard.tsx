import React, { useState } from 'react';
import { Search, MapPin, Clock, Filter, Plus, HeartHandshake, QrCode, Bike, Truck } from 'lucide-react';
import { AppShell, FoodCard, Modal, btn, inputStyle, QRCodeDisplay } from '@/components/app/kit';
import { useApp } from '@/context/AppContext';
import { Donation, PickupMode } from '@/types/domain';

type Tab = 'discover' | 'my-claims' | 'advance-req' | 'history';

export const NgoDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('discover');
  const { user, donations, claims, submitClaim, advanceRequests, createAdvanceRequest, confirmDirectHandover } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  // Claim Modal State
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [claimQty, setClaimQty] = useState<number>(20);
  const [pickupMode, setPickupMode] = useState<PickupMode>('VOLUNTEER');
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Direct Pickup Scanner Simulation State
  const [handoverClaimId, setHandoverClaimId] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState('');

  // Advance Requirement Form
  const [reqCategory, setReqCategory] = useState<'MEALS' | 'RICE' | 'BREAD' | 'FRUITS'>('MEALS');
  const [reqQty, setReqQty] = useState(80);
  const [reqNotes, setReqNotes] = useState('Daily community shelter evening meal distribution.');

  const availableDonations = donations.filter((d) => {
    if (d.status !== 'AVAILABLE' || d.remainingQuantity <= 0) return false;
    if (searchQuery && !d.foodName.toLowerCase().includes(searchQuery.toLowerCase()) && !d.providerName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (dietaryFilter !== 'ALL' && d.foodType !== dietaryFilter) return false;
    return true;
  });

  const myClaims = claims.filter((c) => c.ngoId === (user?.organizationId || 'org-ngo-1'));

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;
    setClaimSubmitting(true);
    try {
      await submitClaim({
        donationId: selectedDonation.id,
        ngoId: user?.organizationId || 'org-ngo-1',
        ngoName: user?.organizationName || 'Helping Hands Trust',
        requestedQuantity: claimQty,
        pickupMode,
        deliveryLocationId: 'loc-ngo-1',
      });
      setSelectedDonation(null);
      setTab('my-claims');
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setClaimSubmitting(false);
    }
  };

  return (
    <AppShell
      role="ngo"
      tab={tab}
      onTab={setTab}
      tabs={[
        { id: 'discover', label: 'Food Discovery', icon: <Search className="w-4 h-4" /> },
        { id: 'my-claims', label: `Active Claims (${myClaims.length})`, icon: <HeartHandshake className="w-4 h-4" /> },
        { id: 'advance-req', label: 'Advance Needs', icon: <Plus className="w-4 h-4" /> },
        { id: 'history', label: 'Impact History', icon: <Clock className="w-4 h-4" /> },
      ]}
    >
      {tab === 'discover' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Available Food Discovery</h2>
              <p className="text-xs text-muted-foreground">
                Browse nearby surplus from restaurants and event venues. Request full or partial allocations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search food or donor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${inputStyle} pl-9 h-10`}
                />
              </div>

              <select
                value={dietaryFilter}
                onChange={(e) => setDietaryFilter(e.target.value as 'ALL' | 'VEG' | 'NON_VEG')}
                className={`${inputStyle} w-32 h-10`}
              >
                <option value="ALL">All Types</option>
                <option value="VEG">Veg Only</option>
                <option value="NON_VEG">Non-Veg</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableDonations.map((d) => (
              <FoodCard
                key={d.id}
                d={d}
                onClick={() => {
                  setSelectedDonation(d);
                  setClaimQty(Math.min(25, d.remainingQuantity));
                }}
                footer={
                  <button
                    onClick={() => {
                      setSelectedDonation(d);
                      setClaimQty(Math.min(25, d.remainingQuantity));
                    }}
                    className={`${btn.primary} w-full`}
                  >
                    Request Food ({d.remainingQuantity} {d.unit} available)
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'my-claims' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Your Food Claims & Delivery Tracking</h2>
          <p className="text-xs text-muted-foreground">
            Track approvals, assigned volunteer couriers, and confirm handovers upon receiving meals.
          </p>

          <div className="grid gap-4">
            {myClaims.map((claim) => (
              <div key={claim.id} className="bg-card border border-border p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-base">Claim #{claim.id.slice(-6)}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        claim.status === 'APPROVED'
                          ? 'bg-accent-soft text-accent'
                          : claim.status === 'COMPLETED'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {claim.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                      {claim.pickupMode}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requested: <strong>{claim.requestedQuantity}</strong> meals • Submitted:{' '}
                    {new Date(claim.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {claim.status === 'APPROVED' && claim.pickupMode === 'DIRECT_NGO' && (
                    <button
                      onClick={() => setHandoverClaimId(claim.id)}
                      className={btn.accent}
                    >
                      <QrCode className="w-4 h-4" /> Scan Provider QR for Handover
                    </button>
                  )}
                  {claim.status === 'APPROVED' && claim.pickupMode === 'VOLUNTEER' && (
                    <span className="text-xs font-bold text-accent flex items-center gap-1.5 bg-accent-soft px-3 py-2 rounded-full">
                      <Bike className="w-4 h-4 animate-bounce" /> Volunteer Courier En Route
                    </span>
                  )}
                  {claim.status === 'COMPLETED' && (
                    <span className="text-xs font-bold text-muted-foreground">Delivered & Verified</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'advance-req' && (
        <div className="max-w-xl mx-auto bg-card border border-border p-8 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-black tracking-tight mb-2">Publish Advance Food Need</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Let local restaurants and event planners know what upcoming meal quantities your shelter requires.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createAdvanceRequest({
                ngoId: user?.organizationId || 'org-ngo-1',
                ngoName: user?.organizationName || 'Helping Hands Trust',
                foodCategory: reqCategory,
                foodType: 'VEG',
                requiredQuantity: reqQty,
                unit: 'MEALS',
                requiredDate: 'Tomorrow',
                requiredBefore: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
                deliveryLocationId: 'loc-ngo-1',
                deliveryAddress: 'Shelter Center, Market Road',
                priority: 'HIGH',
                notes: reqNotes,
              });
              alert('Advance requirement posted successfully!');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Required Meal Type</label>
              <select
                value={reqCategory}
                onChange={(e) => setReqCategory(e.target.value as any)}
                className={inputStyle}
              >
                <option value="MEALS">Cooked Meal Portions</option>
                <option value="RICE">Bulk Rice / Grains</option>
                <option value="BREAD">Breads & Baked Goods</option>
                <option value="FRUITS">Fresh Fruits</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Quantity (Meals / Portions)</label>
              <input
                type="number"
                min={10}
                required
                value={reqQty}
                onChange={(e) => setReqQty(Number(e.target.value))}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Purpose / Timing Notes</label>
              <textarea
                value={reqNotes}
                onChange={(e) => setReqNotes(e.target.value)}
                className={`${inputStyle} h-24 py-3`}
              />
            </div>

            <button type="submit" className={`${btn.primary} w-full`}>
              Post Advance Requirement
            </button>
          </form>
        </div>
      )}

      {/* Claim Submission Dialog */}
      <Modal open={!!selectedDonation} onClose={() => setSelectedDonation(null)} title="Request Food Donation">
        {selectedDonation && (
          <form onSubmit={handleClaimSubmit} className="space-y-4">
            <div className="bg-secondary p-4 rounded-2xl space-y-1">
              <h4 className="font-extrabold text-sm">{selectedDonation.foodName}</h4>
              <p className="text-xs text-muted-foreground">
                Provided by <strong>{selectedDonation.providerName}</strong> • {selectedDonation.pickupAddress}
              </p>
              <div className="text-xs font-bold text-accent pt-1">
                {selectedDonation.remainingQuantity} {selectedDonation.unit} currently available
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                Requested Quantity ({selectedDonation.unit})
              </label>
              <input
                type="number"
                min={1}
                max={selectedDonation.remainingQuantity}
                required
                value={claimQty}
                onChange={(e) => setClaimQty(Number(e.target.value))}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Collection Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickupMode('VOLUNTEER')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    pickupMode === 'VOLUNTEER'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary hover:bg-border/60'
                  }`}
                >
                  <Bike className="w-4 h-4" /> Volunteer Courier
                </button>
                <button
                  type="button"
                  onClick={() => setPickupMode('DIRECT_NGO')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    pickupMode === 'DIRECT_NGO'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary hover:bg-border/60'
                  }`}
                >
                  <Truck className="w-4 h-4" /> Direct NGO Pickup
                </button>
              </div>
            </div>

            <button type="submit" disabled={claimSubmitting} className={`${btn.primary} w-full mt-2`}>
              {claimSubmitting ? 'Submitting...' : 'Submit Claim Request'}
            </button>
          </form>
        )}
      </Modal>

      {/* Direct Handover QR Scanner Dialog */}
      <Modal open={!!handoverClaimId} onClose={() => setHandoverClaimId(null)} title="Direct Pickup QR Verification">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Scan or enter the provider's pickup QR code to verify and confirm receipt of the food batch.
          </p>
          <input
            type="text"
            placeholder="Scan or enter QR token (e.g. QR-PROVIDER-HANDOVER-...)"
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            className={inputStyle}
          />
          <button
            onClick={async () => {
              if (handoverClaimId && scannedCode) {
                await confirmDirectHandover(handoverClaimId, scannedCode);
                setHandoverClaimId(null);
                setScannedCode('');
                alert('Direct handover confirmed! Food recorded as successfully received.');
              }
            }}
            className={`${btn.primary} w-full`}
          >
            Verify & Confirm Handover
          </button>
        </div>
      </Modal>
    </AppShell>
  );
};
