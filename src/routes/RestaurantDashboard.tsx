import React, { useState } from 'react';
import { Plus, Clock, MapPin, CheckCircle, AlertTriangle, QrCode } from 'lucide-react';
import { AppShell, FoodCard, Modal, btn, inputStyle, QRCodeDisplay } from '@/components/app/kit';
import { useApp } from '@/context/AppContext';
import { FoodCategory, FoodType, StorageType, UnitType, Donation } from '@/types/domain';

type Tab = 'donations' | 'requests' | 'new' | 'impact';

export const RestaurantDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('donations');
  const { user, donations, claims, createDonation, reviewClaim } = useApp();

  // Dialog state for reviewing claims & viewing QR
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [approvalQty, setApprovalQty] = useState<number>(10);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [qrModalToken, setQrModalToken] = useState<string | null>(null);

  // Form State for New Donation
  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('MEALS');
  const [foodType, setFoodType] = useState<FoodType>('VEG');
  const [totalQuantity, setTotalQuantity] = useState(50);
  const [unit, setUnit] = useState<UnitType>('MEALS');
  const [storageType, setStorageType] = useState<StorageType>('HOT');
  const [collectionDeadlineHours, setCollectionDeadlineHours] = useState(3);
  const [pickupAddress, setPickupAddress] = useState('MG Road Central, Near Metro Gate 2');
  const [allergens, setAllergens] = useState('Dairy');
  const [safetyDeclared, setSafetyDeclared] = useState(true);
  const [allowPublic, setAllowPublic] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const restaurantDonations = donations.filter((d) => d.providerType !== 'EVENT_ORGANIZER');
  const pendingClaims = claims.filter((c) => c.status === 'PENDING');

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await createDonation({
        organizationId: user?.organizationId || 'org-rest-1',
        providerName: user?.organizationName || 'Spice Route Kitchen',
        providerType: 'RESTAURANT',
        isVerified: true,
        foodName,
        category,
        foodType,
        totalQuantity,
        unit,
        preparedAt: new Date().toISOString(),
        availableFrom: new Date().toISOString(),
        collectionDeadline: new Date(Date.now() + collectionDeadlineHours * 3600 * 1000).toISOString(),
        storageType,
        pickupPointId: 'pp-1',
        pickupAddress,
        pickupPointName: 'Rear Service Bay',
        latitude: 9.9816,
        longitude: 76.2799,
        safetyDeclared,
        status: 'AVAILABLE',
        allowPublicPickup: allowPublic,
        allergens: allergens.split(',').map((s) => s.trim()).filter(Boolean),
        imageUrls: [],
      });
      setFoodName('');
      setTab('donations');
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <AppShell
      role="restaurant"
      tab={tab}
      onTab={setTab}
      tabs={[
        { id: 'donations', label: 'Surplus Listings', icon: <Plus className="w-4 h-4" /> },
        { id: 'requests', label: `NGO Claims (${pendingClaims.length})`, icon: <CheckCircle className="w-4 h-4" /> },
        { id: 'new', label: 'Donate Food', icon: <Plus className="w-4 h-4" /> },
        { id: 'impact', label: 'Impact & Records', icon: <Clock className="w-4 h-4" /> },
      ]}
    >
      {tab === 'donations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Active Surplus Food</h2>
              <p className="text-xs text-muted-foreground">Manage your posted food donations and dispatch handovers.</p>
            </div>
            <button onClick={() => setTab('new')} className={btn.primary}>
              <Plus className="w-4 h-4" /> Post New Donation
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurantDonations.map((d) => (
              <FoodCard
                key={d.id}
                d={d}
                onClick={() => setActiveDonation(d)}
                footer={
                  <div className="flex items-center justify-between border-t border-border/80 pt-3 text-xs">
                    <span className="font-semibold text-muted-foreground">
                      Status: <strong className="text-accent">{d.status}</strong>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrModalToken(`QR-PROVIDER-HANDOVER-${d.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-border font-bold text-foreground transition cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Pickup QR
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Pending NGO Claims</h2>
          <p className="text-xs text-muted-foreground">
            Review food claim requests from accredited shelters and charities. You can approve partial quantities.
          </p>

          {pendingClaims.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-accent" />
              <p className="font-bold">All caught up!</p>
              <p className="text-xs">No pending claims awaiting your approval.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingClaims.map((claim) => (
                <div key={claim.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-extrabold text-base text-foreground">{claim.ngoName}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent-soft text-accent font-bold">
                        {claim.pickupMode}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested: <strong>{claim.requestedQuantity}</strong> units • Submitted:{' '}
                      {new Date(claim.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedClaimId(claim.id);
                        setApprovalQty(claim.requestedQuantity);
                      }}
                      className={btn.primary}
                    >
                      Review & Approve
                    </button>
                    <button
                      onClick={async () => {
                        const reason = prompt('Reason for rejection:');
                        if (reason) await reviewClaim(claim.id, false, 0, reason);
                      }}
                      className={btn.danger}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'new' && (
        <div className="max-w-2xl mx-auto bg-card border border-border p-8 rounded-3xl shadow-sm">
          <h2 className="text-2xl font-black tracking-tight mb-2">Publish Surplus Food</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Help prevent food waste by listing surplus batches with clear food safety timelines.
          </p>

          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Food Item Name & Details</label>
              <input
                type="text"
                required
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className={inputStyle}
                placeholder="e.g. 50 Packs Vegetable Pulao & Curry"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Food Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className={inputStyle}
                >
                  <option value="MEALS">Cooked Meals</option>
                  <option value="RICE">Rice Dish</option>
                  <option value="BREAD">Breads & Bakery</option>
                  <option value="FRUITS">Fresh Fruits</option>
                  <option value="VEGETABLES">Vegetables</option>
                  <option value="OTHER">Other Surplus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Dietary Type</label>
                <select
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value as FoodType)}
                  className={inputStyle}
                >
                  <option value="VEG">Vegetarian</option>
                  <option value="NON_VEG">Non-Vegetarian</option>
                  <option value="VEGAN">Vegan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Total Quantity</label>
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
                  <option value="MEALS">Meals / Portions</option>
                  <option value="KG">Kilograms (kg)</option>
                  <option value="PACKETS">Packets / Boxes</option>
                  <option value="LITRES">Litres</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Storage Condition</label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value as StorageType)}
                  className={inputStyle}
                >
                  <option value="HOT">Hot Insulated (&gt; 60°C)</option>
                  <option value="REFRIGERATED">Refrigerated (&lt; 4°C)</option>
                  <option value="AMBIENT">Ambient Room Temp</option>
                  <option value="FROZEN">Frozen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Collection Deadline</label>
                <select
                  value={collectionDeadlineHours}
                  onChange={(e) => setCollectionDeadlineHours(Number(e.target.value))}
                  className={inputStyle}
                >
                  <option value={2}>Within 2 hours</option>
                  <option value={3}>Within 3 hours</option>
                  <option value={4}>Within 4 hours</option>
                  <option value={8}>Within 8 hours</option>
                  <option value={24}>Within 24 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Pickup Address</label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Allergens</label>
              <input
                type="text"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                className={inputStyle}
                placeholder="e.g. Dairy, Peanuts, Gluten (comma separated)"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <label className="flex items-center gap-3 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyDeclared}
                  onChange={(e) => setSafetyDeclared(e.target.checked)}
                  className="rounded w-4 h-4 text-primary"
                />
                <span>I confirm that this food has been prepared hygienically and remains completely safe for consumption.</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPublic}
                  onChange={(e) => setAllowPublic(e.target.checked)}
                  className="rounded w-4 h-4 text-primary"
                />
                <span>Also make visible for free direct Public collection by neighbours</span>
              </label>
            </div>

            <button type="submit" disabled={formSubmitting || !safetyDeclared} className={`${btn.primary} w-full mt-4`}>
              {formSubmitting ? 'Publishing...' : 'Publish Surplus Food Donation'}
            </button>
          </form>
        </div>
      )}

      {tab === 'impact' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Your Rescue Impact</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-card border border-border p-6 rounded-3xl">
              <div className="text-3xl font-black text-accent mb-1">420 kg</div>
              <div className="text-xs text-muted-foreground font-semibold">Total Surplus Food Rescued</div>
            </div>
            <div className="bg-card border border-border p-6 rounded-3xl">
              <div className="text-3xl font-black text-primary mb-1">840</div>
              <div className="text-xs text-muted-foreground font-semibold">Meals Provided to Beneficiaries</div>
            </div>
            <div className="bg-card border border-border p-6 rounded-3xl">
              <div className="text-3xl font-black text-event mb-1">1,050 kg</div>
              <div className="text-xs text-muted-foreground font-semibold">CO₂ Emissions Prevented</div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Approval Modal */}
      <Modal open={!!selectedClaimId} onClose={() => setSelectedClaimId(null)} title="Approve Food Claim">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Specify the quantity allocated for this NGO. The remaining surplus will remain open for other organizations.
          </p>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">Approved Quantity</label>
            <input
              type="number"
              min={1}
              value={approvalQty}
              onChange={(e) => setApprovalQty(Number(e.target.value))}
              className={inputStyle}
            />
          </div>

          <button
            onClick={async () => {
              if (selectedClaimId) {
                await reviewClaim(selectedClaimId, true, approvalQty);
                setSelectedClaimId(null);
              }
            }}
            className={`${btn.primary} w-full`}
          >
            Confirm Approval & Generate Pickup Code
          </button>
        </div>
      </Modal>

      {/* Provider Pickup QR Code Modal */}
      <Modal open={!!qrModalToken} onClose={() => setQrModalToken(null)} title="Handoff Verification QR">
        {qrModalToken && (
          <QRCodeDisplay
            token={qrModalToken}
            title="Present to Volunteer or NGO on Pickup"
            subtitle="The courier will scan this code to confirm physical possession of the food batch."
          />
        )}
      </Modal>
    </AppShell>
  );
};
