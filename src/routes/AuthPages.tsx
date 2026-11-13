import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Logo, btn, inputStyle, ROLES, ROLE_ICON } from '@/components/app/kit';
import { useApp } from '@/context/AppContext';
import { Role } from '@/types/domain';

export const SignInPage: React.FC = () => {
  const { signInRole } = useApp();
  const nav = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('restaurant');
  const [email, setEmail] = useState('manager@greenbistro.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signInRole(selectedRole);
    if (selectedRole === 'restaurant') nav('/restaurant');
    else if (selectedRole === 'event') nav('/event');
    else if (selectedRole === 'ngo') nav('/ngo');
    else if (selectedRole === 'volunteer') nav('/volunteer');
    else nav('/public');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6">
      <header className="max-w-xl mx-auto w-full pt-4">
        <Logo />
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
          <h1 className="text-2xl font-black tracking-tight mb-2">Welcome back</h1>
          <p className="text-xs text-muted-foreground mb-6">
            Sign in to access your role-specific dashboard and actions.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Select Persona</label>
              <div className="grid grid-cols-2 gap-2 mb-2 sm:grid-cols-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      selectedRole === r.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary hover:bg-border/60 text-foreground'
                    }`}
                  >
                    <span>{r.label.split('/')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
                placeholder="you@organization.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputStyle}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className={`${btn.primary} w-full mt-2`}>
              Log in as {selectedRole.toUpperCase()}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-xl mx-auto w-full text-center text-xs text-muted-foreground pb-4">
        © 2026 PlateShare
      </footer>
    </div>
  );
};

export const SignUpPage: React.FC = () => {
  const [params] = useSearchParams();
  const initialRole = (params.get('role') as Role) || 'restaurant';
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { signInRole } = useApp();
  const nav = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    signInRole(role);
    if (role === 'restaurant') nav('/restaurant');
    else if (role === 'event') nav('/event');
    else if (role === 'ngo') nav('/ngo');
    else if (role === 'volunteer') nav('/volunteer');
    else nav('/public');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-6">
      <header className="max-w-xl mx-auto w-full pt-4">
        <Logo />
      </header>

      <main className="max-w-md mx-auto w-full my-auto py-8">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-sm">
          <h1 className="text-2xl font-black tracking-tight mb-2">Create an account</h1>
          <p className="text-xs text-muted-foreground mb-6">
            Join the PlateShare food rescue network. Choose your organization or volunteer role below.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Your Role</label>
              <div className="grid grid-cols-2 gap-2 mb-2 sm:grid-cols-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      role === r.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary hover:bg-border/60 text-foreground'
                    }`}
                  >
                    <span>{r.label.split('/')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputStyle}
                placeholder="e.g. Alex Morgan"
              />
            </div>

            {role !== 'volunteer' && role !== 'public' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  {role === 'event' ? 'Event / Host Name' : 'Organization / Restaurant Name'}
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className={inputStyle}
                  placeholder={role === 'event' ? 'Wedding Reception / Annual Gala' : 'e.g. Spice Route Bistro'}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
                placeholder="name@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputStyle}
                placeholder="+91 98470 12345"
              />
            </div>

            <button type="submit" className={`${btn.primary} w-full mt-2`}>
              Complete Registration & Enter
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already registered?{' '}
            <Link to="/signin" className="font-bold text-primary hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>

      <footer className="max-w-xl mx-auto w-full text-center text-xs text-muted-foreground pb-4">
        © 2026 PlateShare
      </footer>
    </div>
  );
};
