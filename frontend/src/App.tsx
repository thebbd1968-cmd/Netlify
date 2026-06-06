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
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="portfolios" element={<PortfoliosPage />} />
            <Route path="nurture" element={<NurturePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}