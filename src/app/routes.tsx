import { createBrowserRouter, Navigate } from 'react-router';
import AuthPage from './pages/AuthPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MessagesPage from './pages/MessagesPage';
import GalleryPage from './pages/GalleryPage';
import TimelinePage from './pages/TimelinePage';
import ExtrasPage from './pages/ExtrasPage';
import CoupleProfilePage from './pages/CoupleProfilePage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import MemoriesPage from './pages/MemoriesPage';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true,         element: <HomePage /> },
      { path: 'messages',   element: <MessagesPage /> },
      { path: 'gallery',    element: <GalleryPage /> },
      { path: 'timeline',   element: <TimelinePage /> },
      { path: 'extras',     element: <ExtrasPage /> },
      { path: 'profile',    element: <CoupleProfilePage /> },
      { path: 'calendar',   element: <CalendarPage /> },
      { path: 'goals',      element: <GoalsPage /> },
      { path: 'memories',   element: <MemoriesPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
