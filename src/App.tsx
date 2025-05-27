import { Route, Switch } from 'wouter'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { Toaster } from './components/ui/toaster'
import { TooltipProvider } from './components/ui/tooltip'
import { AuthProvider } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import { StorageProvider } from './contexts/StorageContext'

// Pages
import HomePage from './pages/HomePage'
import LandingPage from './pages/LandingPage'
import UserFilesPage from './pages/UserFilesPage'
import NotFound from './pages/NotFound'

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/app" component={HomePage} />
      <Route path="/files" component={UserFilesPage} />
      <Route component={NotFound} />
    </Switch>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <StorageProvider>
            <AppProvider>
              <Toaster />
              <Router />
            </AppProvider>
          </StorageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App 