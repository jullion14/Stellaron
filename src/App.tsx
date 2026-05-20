import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/ui/Navbar';
import Home       from '@/pages/Home';
import Characters from '@/pages/Characters';
import Builder    from '@/pages/Builder';
import Team       from '@/pages/Team';
import CharacterDetail from '@/pages/CharacterDetail';

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
              <Route path="/"           element={<Home />} />
              <Route path="/characters" element={<Characters />} />
              <Route path="/builder"    element={<Builder />} />
              <Route path="/team"       element={<Team />} />
              <Route path="/characters/:id" element={<CharacterDetail />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
