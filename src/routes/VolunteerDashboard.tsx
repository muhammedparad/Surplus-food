import React, { useState } from 'react';
import { Bike, MapPin, CheckCircle, Navigation, QrCode, Clock, ShieldCheck } from 'lucide-react';
import { AppShell, Modal, btn, inputStyle, QRCodeDisplay } from '@/components/app/kit';
import { useApp } from '@/context/AppContext';
import { DeliveryTask } from '@/types/domain';

type Tab = 'available' | 'active' | 'completed';

export const VolunteerDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('available');
  const { user, deliveries, acceptDelivery, confirmPickup, confirmDelivery } = useApp();

  const [activeTask, setActiveTask] = useState<DeliveryTask | null>(
    deliveries.find((d) => d.volunteerId === user?.id && d.status !== 'DELIVERED') || null
  );

  const [scanModalType, setScanModalType] = useState<'PICKUP' | 'DELIVERY' | null>(null);
  const [qrInput, setQrInput] = useState('');

  const availableDeliveries = deliveries.filter((d) => d.status === 'PENDING');
  const completedDeliveries = deliveries.filter(
    (d) => d.volunteerId === user?.id && d.status === 'DELIVERED'
  );

  const handleAccept = async (task: DeliveryTask) => {
    try {
      await acceptDelivery(task.id);
      setActiveTask({ ...task, status: 'ACCEPTED', volunteerId: user?.id, volunteerName: user?.name });
      setTab('active');
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <AppShell
      role="volunteer"
      tab={tab}
      onTab={setTab}
      tabs={[
        { id: 'available', label: `Available Missions (${availableDeliveries.length})`, icon: <Bike className="w-4 h-4" /> },
        { id: 'active', label: 'Active Delivery Cockpit', icon: <Navigation className="w-4 h-4" /> },
        { id: 'completed', label: 'Completed Missions', icon: <CheckCircle className="w-4 h-4" /> },
      ]}
    >
      {tab === 'available' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Available Rescue Missions</h2>
              <p className="text-xs text-muted-foreground">
                One-task limit enforced. Courier surplus food safely from food donors to local shelters.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-soft text-accent text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> Verified Courier Status
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {availableDeliveries.map((task) => (
              <div key={task.id} className="bg-card border border-border p-6 rounded-3xl space-y-4 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">{task.donationTitle}</h3>
                    <p className="text-xs text-muted-foreground">
                      Batch: <strong>{task.quantity} {task.unit}</strong>
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary text-primary">
                    Immediate Pickup
                  </span>
                </div>

                <div className="space-y-2 text-xs bg-secondary/50 p-4 rounded-2xl border border-border/60">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      P
                    </span>
                    <div>
                      <span className="font-bold text-foreground">Pickup from: </span>
                      <span className="text-muted-foreground">{task.providerName} ({task.providerAddress})</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                      D
                    </span>
                    <div>
                      <span className="font-bold text-foreground">Deliver to: </span>
                      <span className="text-muted-foreground">{task.ngoName} ({task.deliveryAddress})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAccept(task)}
                  disabled={!!activeTask && activeTask.status !== 'DELIVERED'}
                  className={`${btn.primary} w-full`}
                >
                  {activeTask && activeTask.status !== 'DELIVERED'
                    ? 'Complete Current Mission First'
                    : 'Accept Delivery Mission'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'active' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Active Delivery Cockpit</h2>

          {!activeTask || activeTask.status === 'DELIVERED' ? (
            <div className="bg-card border border-border p-12 rounded-3xl text-center text-muted-foreground">
              <Bike className="w-12 h-12 mx-auto mb-3 text-muted-foreground/60" />
              <h3 className="font-bold text-base text-foreground mb-1">No Active Mission</h3>
              <p className="text-xs mb-4">You are not currently assigned to any delivery mission.</p>
              <button onClick={() => setTab('available')} className={btn.primary}>
                Browse Available Missions
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border p-8 rounded-3xl space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <span className="text-xs font-bold text-accent tracking-wider uppercase">Active Mission</span>
                  <h3 className="text-xl font-black">{activeTask.donationTitle}</h3>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-accent font-extrabold text-accent-foreground">
                  {activeTask.status}
                </span>
              </div>

              {/* Step indicator */}
              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div
                  className={`p-3 rounded-2xl border font-bold ${
                    activeTask.status === 'ACCEPTED'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary text-muted-foreground'
                  }`}
                >
                  1. En Route to Pickup
                </div>
                <div
                  className={`p-3 rounded-2xl border font-bold ${
                    activeTask.status === 'IN_TRANSIT'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-secondary text-muted-foreground'
                  }`}
                >
                  2. En Route to Delivery
                </div>
              </div>

              {/* Waypoints */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-secondary/80 border border-border">
                  <div className="text-xs font-bold text-muted-foreground mb-1">Pickup Location</div>
                  <div className="font-bold text-sm text-foreground">{activeTask.providerName}</div>
                  <div className="text-xs text-muted-foreground">{activeTask.providerAddress}</div>
                  {activeTask.providerPhone && (
                    <div className="text-xs text-primary font-bold mt-1">Phone: {activeTask.providerPhone}</div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-secondary/80 border border-border">
                  <div className="text-xs font-bold text-muted-foreground mb-1">Drop-off Destination</div>
                  <div className="font-bold text-sm text-foreground">{activeTask.ngoName}</div>
                  <div className="text-xs text-muted-foreground">{activeTask.deliveryAddress}</div>
                  {activeTask.ngoPhone && (
                    <div className="text-xs text-primary font-bold mt-1">Phone: {activeTask.ngoPhone}</div>
                  )}
                </div>
              </div>

              {/* Actions based on stage */}
              <div className="pt-4 border-t border-border">
                {activeTask.status === 'ACCEPTED' && (
                  <button
                    onClick={() => setScanModalType('PICKUP')}
                    className={`${btn.primary} w-full h-12 text-base`}
                  >
                    <QrCode className="w-5 h-5 mr-1" /> Scan Provider's Pickup QR
                  </button>
                )}

                {activeTask.status === 'IN_TRANSIT' && (
                  <button
                    onClick={() => setScanModalType('DELIVERY')}
                    className={`${btn.accent} w-full h-12 text-base`}
                  >
                    <QrCode className="w-5 h-5 mr-1" /> Scan NGO's Delivery QR & Complete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Verification Modal */}
      <Modal
        open={!!scanModalType}
        onClose={() => setScanModalType(null)}
        title={scanModalType === 'PICKUP' ? 'Scan Provider Pickup QR' : 'Scan NGO Delivery QR'}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {scanModalType === 'PICKUP'
              ? 'Scan or enter the verification token shown on the food provider’s screen to confirm physical pickup.'
              : 'Scan or enter the verification token shown by the NGO recipient to complete the mission.'}
          </p>

          <input
            type="text"
            required
            placeholder="Scan token or paste QR string..."
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            className={inputStyle}
          />

          <button
            onClick={async () => {
              if (!activeTask) return;
              if (scanModalType === 'PICKUP') {
                await confirmPickup(activeTask.id, qrInput);
                setActiveTask({ ...activeTask, status: 'IN_TRANSIT' });
              } else {
                await confirmDelivery(activeTask.id, qrInput);
                setActiveTask(null);
                setTab('completed');
              }
              setScanModalType(null);
              setQrInput('');
            }}
            className={`${btn.primary} w-full`}
          >
            Confirm Verification via Backend
          </button>
        </div>
      </Modal>
    </AppShell>
  );
};
