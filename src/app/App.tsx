import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { GamificationProvider } from './context/GamificationContext';
import { AppDataProvider } from './context/AppDataContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <PresenceProvider>
        <GamificationProvider>
          <AppDataProvider>
            <Toaster position="top-center" richColors />
            <RouterProvider router={router} />
          </AppDataProvider>
        </GamificationProvider>
      </PresenceProvider>
    </AuthProvider>
  );
}
