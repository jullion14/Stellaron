import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/ui/Navbar';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import Home from '@/pages/Home';
import Characters from '@/pages/Characters';
import Builder from '@/pages/Builder';
import Team from '@/pages/Team';
import CharacterDetail from '@/pages/CharacterDetail';
import LightConeDetail from './pages/LightConeDetail';
import LightConeList from './pages/LightCones';
import Relics from './pages/Relics';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
          <Navbar />
          <main>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/characters/:id" element={<CharacterDetail />} />
              <Route path="/light-cones" element={<LightConeList />} />
              <Route path="/light-cones/:id" element={<LightConeDetail />} />
              <Route path="/relics" element={<Relics />} />
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route path="/builder" element={
                <ProtectedRoute>
                  <Builder />
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}