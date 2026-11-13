import React from 'react';
import { Users, MapPin, Clock, AlertCircle, Info, Heart } from 'lucide-react';
import { AppShell, FoodCard, btn } from '@/components/app/kit';
import { useApp } from '@/context/AppContext';

export const PublicDashboard: React.FC = () => {
  const { donations } = useApp();

  // Public food only includes donations where allowPublicPickup is true and food is verified safe
  const publicDonations = donations.filter((d) => d.allowPublicPickup && d.remainingQuantity > 0);

  return (
    <AppShell
      role="public"
      tab="public"
      onTab={() => {}}
      tabs={[{ id: 'public', label: 'Public Surplus Food', icon: <Users className="w-4 h-4" /> }]}
    >
      <div className="space-y-6">
        <div className="bg-accent-soft border border-accent/20 p-6 rounded-3xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shrink-0 mt-0.5">
            <Heart className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-accent">Free Community Food Table</h3>
            <p className="text-xs text-foreground/80 leading-relaxed">
              These items have been voluntarily released for open public pickup by local food donors and bakeries. No NGO registration is required. Please carry your own clean container.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight mb-1">Available Nearby for Community Collection</h2>
          <p className="text-xs text-muted-foreground">
            Visit the pickup location before the collection deadline. Respect hygiene guidelines.
          </p>
        </div>

        {publicDonations.length === 0 ? (
          <div className="bg-card border border-border p-12 rounded-3xl text-center text-muted-foreground">
            <Info className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
            <h4 className="font-bold text-foreground">No Public Food Right Now</h4>
            <p className="text-xs">Check back soon as local bakeries and restaurants release surplus batches.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {publicDonations.map((d) => (
              <FoodCard
                key={d.id}
                d={d}
                footer={
                  <div className="space-y-2 border-t border-border/80 pt-3">
                    {d.publicInstructions && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2">
                        "{d.publicInstructions}"
                      </p>
                    )}
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(d.pickupAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${btn.primary} w-full text-xs`}
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1" /> Get Directions to Pickup Point
                    </a>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
