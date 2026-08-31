import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { GamificationProvider } from './context/GamificationContext';
import { AppDataProvider } from './context/AppDataContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <GamificationProvider>
        <AppDataProvider>
          <Toaster position="top-center" richColors />
          <RouterProvider router={router} />
        </AppDataProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}
