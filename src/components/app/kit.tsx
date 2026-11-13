import { Link, useNavigate } from 'react-router-dom';
import React, { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  BadgeCheck,
  Clock,
  MapPin,
  PartyPopper,
  Store,
  LogOut,
  HeartHandshake,
  Bike,
  Users,
  Building2,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Donation, Role } from '@/types/domain';
import { cn } from '@/lib/utils';

export const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: 'ngo', label: 'NGO / Charity', hint: 'Discover & claim surplus food for beneficiaries' },
  { id: 'restaurant', label: 'Restaurant / Caterer', hint: 'Donate surplus regularly & approve claims' },
  { id: 'event', label: 'Event Organizer', hint: 'Publish large-scale feast & function food' },
  { id: 'volunteer', label: 'Volunteer Courier', hint: 'Deliver meals safely using QR handovers' },
  { id: 'public', label: 'General Public', hint: 'Find free safe surplus food nearby' },
];

export const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  restaurant: Store,
  event: PartyPopper,
  ngo: HeartHandshake,
  volunteer: Bike,
  public: Users,
};

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 h-11 text-sm font-semibold text-primary-foreground transition hover:opacity-85 disabled:opacity-40 cursor-pointer',
  ghost:
    'inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 h-11 text-sm font-semibold text-secondary-foreground transition hover:bg-border cursor-pointer',
  accent:
    'inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 h-11 text-sm font-semibold text-accent-foreground transition hover:opacity-85 cursor-pointer',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 h-11 text-sm font-semibold text-destructive transition hover:bg-border cursor-pointer',
  outline:
    'inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 h-11 text-sm font-semibold transition hover:bg-secondary cursor-pointer',
};

export const inputStyle =
  'h-12 w-full rounded-xl bg-secondary px-4 text-sm outline-none ring-ring focus:ring-2 border border-transparent focus:border-border transition';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground font-black text-sm">
        P
      </span>
      <span>PlateShare</span>
    </Link>
  );
}

export function SourceTag({ d }: { d: Donation }) {
  return d.providerType === 'EVENT_ORGANIZER' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-event-soft px-2.5 py-1 text-xs font-bold text-event">
      <PartyPopper className="h-3.5 w-3.5" />
      {d.eventType || 'Event Surplus'}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-foreground">
      <Store className="h-3.5 w-3.5" />
      Restaurant
    </span>
  );
}

export function VerifiedBadge({ ok }: { ok: boolean }) {
  if (!ok) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
      <BadgeCheck className="h-4 w-4" />
      Verified
    </span>
  );
}

export function FoodCard({
  d,
  onClick,
  footer,
}: {
  d: Donation;
  onClick?: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="group overflow-hidden rounded-3xl border bg-card transition hover:shadow-xl flex flex-col justify-between">
      <button onClick={onClick} className="block w-full text-left cursor-pointer">
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {d.imageUrls[0] ? (
            <img
              src={d.imageUrls[0]}
              alt={d.foodName}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-semibold">
              Food Rescue
            </div>
          )}
          <div className="absolute left-3 top-3">
            <SourceTag d={d} />
          </div>
          {d.remainingQuantity === 0 && (
            <div className="absolute inset-0 grid place-items-center bg-foreground/70 text-lg font-bold text-background backdrop-blur-xs">
              Fully Claimed
            </div>
          )}
        </div>

        <div className="space-y-2 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-base leading-snug line-clamp-1">{d.foodName}</h3>
            <span className="shrink-0 text-sm font-black text-accent">
              {d.remainingQuantity} <span className="font-medium text-muted-foreground text-xs">{d.unit}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="line-clamp-1">{d.providerName}</span>
            <VerifiedBadge ok={d.isVerified} />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1 border-t border-border/60">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {d.distanceKm ? `${d.distanceKm} km` : d.pickupAddress.split(',')[0]}
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Expires {new Date(d.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </button>

      {footer && <div className="px-5 pb-5">{footer}</div>}
    </div>
  );
}

export function AppShell<T extends string>({
  role,
  tabs,
  tab,
  onTab,
  children,
}: {
  role: Role;
  tabs: { id: T; label: string; icon: ReactNode }[];
  tab: T;
  onTab: (t: T) => void;
  children: ReactNode;
}) {
  const { user, signOut, notifications } = useApp();
  const nav = useNavigate();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Logo />

          <nav className="hidden flex-1 gap-1 md:flex">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => onTab(t.id)}
                className={cn(
                  'rounded-full px-4 h-9 text-sm font-semibold transition cursor-pointer',
                  tab === t.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground hover:bg-border transition"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-foreground leading-tight">{user?.name}</span>
              <span className="text-[11px] text-muted-foreground capitalize">{user?.role}</span>
            </div>

            <button
              aria-label="Sign out"
              onClick={() => {
                signOut();
                nav('/');
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-border text-foreground transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur md:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition',
              tab === t.id ? 'text-primary font-bold' : 'text-muted-foreground'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-xs sm:items-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-background p-6 shadow-2xl sm:rounded-3xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary hover:bg-border text-foreground transition cursor-pointer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function QRCodeDisplay({ token, title, subtitle }: { token: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-3xl border border-border">
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-3">
        <QRCodeSVG value={token} size={180} level="H" />
      </div>
      <h4 className="font-bold text-sm text-foreground">{title}</h4>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{subtitle}</p>}
      <span className="mt-3 font-mono text-[11px] bg-background px-3 py-1 rounded-full border border-border text-muted-foreground">
        {token}
      </span>
    </div>
  );
}
