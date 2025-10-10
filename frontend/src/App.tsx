import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import EquipmentPage from './pages/Equipment/EquipmentPage';
import ProjectsPage from './pages/Projects/ProjectsPage';
import QuotesPage from './pages/Quotes/QuotesPage';
import DeliveryPage from './pages/Delivery/DeliveryPage';
import InvoicesPage from './pages/Invoices/InvoicesPage';
import UsersPage from './pages/Users/UsersPage';
import LoadingSpinner from './components/Common/LoadingSpinner';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <LoadingSpinner />
      </Box>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/delivery" element={<DeliveryPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
