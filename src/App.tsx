/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastContainer } from './components/shared/ToastContainer';
import { WorkspaceBar } from './components/shared/WorkspaceBar';
import { CustomerLayout } from './components/customer/CustomerLayout';
import { BookDemoPage } from './components/customer/BookDemoPage';
import { RequestServicePage } from './components/customer/RequestServicePage';
import { WarrantyPage } from './components/customer/WarrantyPage';
import { StaffLayout } from './components/staff/StaffLayout';
import { DashboardPage } from './components/staff/DashboardPage';
import { BookingCalendarPage } from './components/staff/BookingCalendarPage';
import { ServiceTicketsPage } from './components/staff/ServiceTicketsPage';
import { TechnicianViewPage } from './components/staff/TechnicianViewPage';
import { InstallationJobsPage } from './components/staff/InstallationJobsPage';
import { SettingsPage } from './components/staff/SettingsPage';

const AppRouter: React.FC = () => {
  const { role, customerPage, staffPage } = useApp();

  if (role === 'customer') {
    return (
      <CustomerLayout>
        {customerPage === 'book-demo' && <BookDemoPage />}
        {customerPage === 'request-service' && <RequestServicePage />}
        {customerPage === 'warranty' && <WarrantyPage />}
      </CustomerLayout>
    );
  }

  return (
    <StaffLayout>
      {staffPage === 'dashboard' && <DashboardPage />}
      {staffPage === 'calendar' && <BookingCalendarPage />}
      {staffPage === 'tickets' && <ServiceTicketsPage />}
      {staffPage === 'technician' && <TechnicianViewPage />}
      {staffPage === 'installations' && <InstallationJobsPage />}
      {staffPage === 'settings' && <SettingsPage />}
    </StaffLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col">
        <WorkspaceBar />
        <div className="flex-1">
          <AppRouter />
        </div>
        <ToastContainer />
      </div>
    </AppProvider>
  );
}
