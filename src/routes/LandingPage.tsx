import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Heart, Bike } from 'lucide-react';
import hero from '@/assets/hero-share.jpg';
import { Logo, btn, ROLES, ROLE_ICON } from '@/components/app/kit';
import { useApp } from '@/context/AppContext';

export const LandingPage: React.FC = () => {
  const { signInRole } = useApp();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 border-b border-border/40">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/signin" className={btn.ghost}>
            Log in
          </Link>
          <Link to="/signup" className={btn.primary}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-bold text-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Food Rescue & Redistribution</span>
          </div>
          <h1 className="text-5xl font-black leading-[1.08] tracking-tight md:text-6xl text-foreground">
            Good food<br />shouldn't go<br />to waste.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground leading-relaxed">
            Restaurants, caterers and wedding hosts share fresh surplus food. Verified NGOs, volunteers and neighbours collect it in minutes.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link to="/signup?role=restaurant" className={btn.primary}>
              Donate food <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/signup?role=ngo" className={btn.ghost}>
              Find food for NGO
            </Link>
            <Link to="/public" className={btn.outline}>
              Public Open Food
            </Link>
          </div>
        </div>

        <div className="relative">
          <img
            src={hero}
            alt="Volunteer handing over meal boxes"
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-2xl border border-border"
          />
          <div className="absolute -bottom-5 -left-5 bg-card/95 backdrop-blur border border-border p-4 rounded-2xl shadow-xl hidden sm:flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground grid place-items-center font-bold text-lg">
              100%
            </div>
            <div>
              <div className="font-extrabold text-sm">QR Code Handover</div>
              <div className="text-xs text-muted-foreground">Every meal tracked & verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="bg-secondary/60 border-y border-border/40 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          {[
            {
              num: '1',
              title: 'Publish in 60s',
              desc: 'Food businesses and event organizers declare safety, food type, and collection deadlines.',
            },
            {
              num: '2',
              title: 'Claim & Allocate',
              desc: 'Verified NGOs request full or partial batches with real-time food safety countdowns.',
            },
            {
              num: '3',
              title: 'Deliver via QR',
              desc: 'Volunteers and NGOs verify handoffs with cryptographic QR tokens confirmed by backend.',
            },
          ].map((item) => (
            <div key={item.num} className="bg-card p-6 rounded-3xl border border-border/80 shadow-xs">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-primary font-black text-primary-foreground">
                {item.num}
              </div>
              <h3 className="text-xl font-extrabold mb-2 text-foreground">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 Distinct Personas */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-3xl font-black tracking-tight mb-3">Five dedicated experiences</h2>
          <p className="text-muted-foreground text-sm">
            Select your role to explore the tailored dashboards and real-time workflows built for your needs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ROLES.map((r) => {
            const Icon = ROLE_ICON[r.id];
            return (
              <Link
                key={r.id}
                to={`/signup?role=${r.id}`}
                onClick={() => signInRole(r.id)}
                className="group rounded-3xl bg-card border border-border p-6 transition duration-200 hover:border-primary hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground transition mb-4 text-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="font-extrabold text-base mb-1 text-foreground">{r.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{r.hint}</div>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold text-primary group-hover:translate-x-1 transition">
                  <span>Enter view</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>© 2026 PlateShare — Surplus Food Rescue & Redistribution System</p>
      </footer>
    </div>
  );
};
