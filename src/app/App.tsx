import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { GamificationProvider } from './context/GamificationContext';
import { AppDataProvider } from './context/AppDataContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <GamificationProvider>
        <AppDataProvider>
          <RouterProvider router={router} />
        </AppDataProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}
