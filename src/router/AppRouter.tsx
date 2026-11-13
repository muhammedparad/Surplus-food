import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/routes/LandingPage';
import { SignInPage, SignUpPage } from '@/routes/AuthPages';
import { RestaurantDashboard } from '@/routes/RestaurantDashboard';
import { EventDashboard } from '@/routes/EventDashboard';
import { NgoDashboard } from '@/routes/NgoDashboard';
import { VolunteerDashboard } from '@/routes/VolunteerDashboard';
import { PublicDashboard } from '@/routes/PublicDashboard';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export const AppRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <OfflineBanner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/restaurant" element={<RestaurantDashboard />} />
          <Route path="/event" element={<EventDashboard />} />
          <Route path="/ngo" element={<NgoDashboard />} />
          <Route path="/volunteer" element={<VolunteerDashboard />} />
          <Route path="/public" element={<PublicDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
