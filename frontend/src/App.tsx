import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DealsPage from './pages/DealsPage'
import ContactsPage from './pages/ContactsPage'
import PropertiesPage from './pages/PropertiesPage'
import TasksPage from './pages/TasksPage'
import PortfoliosPage from './pages/PortfoliosPage'
import NurturePage from './pages/NurturePage'
import PricingPage from './pages/PricingPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          {/*
            The app lives under /dashboard, /deals, /contacts, … rather than at "/".
            The public "/" is the marketing home, rendered server-side by the site
            (site/src/routes/index.tsx), so the signed-in dashboard needs its own
            URL — and every one of these paths must also be reachable as a deep
            link, which site/serve.ts handles by returning this SPA's shell.
          */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/portfolios" element={<PortfoliosPage />} />
            <Route path="/nurture" element={<NurturePage />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}