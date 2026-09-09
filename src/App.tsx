import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HouseholdProvider, useHousehold } from '@/context/HouseholdContext';
import { RecipeProvider } from '@/context/RecipeContext';
import { AuthScreen } from '@/components/AuthScreen';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { MainApp } from '@/components/MainApp';
import { GuestApp } from '@/components/GuestApp';
import { Loader2 } from 'lucide-react';

function Gate() {
  const { loading, user, guest, isGuest } = useAuth();
  const { household, loading: hhLoading } = useHousehold();

  if (loading || (user && hhLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (isGuest && guest) return <GuestApp />;
  if (!user) return <AuthScreen />;
  if (!household) return <OnboardingScreen />;
  return (
    <RecipeProvider>
      <MainApp />
    </RecipeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <Gate />
      </HouseholdProvider>
    </AuthProvider>
  );
}
