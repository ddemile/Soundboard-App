import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getCurrentWindow } from "@tauri-apps/api/window"
import ReactDOM from 'react-dom/client'
import './index.css'
import { lazy, Suspense } from 'react';

const queryClient = new QueryClient()
const { label } = getCurrentWindow()

const AppComponent = lazy(() =>
  label === "main" ? import('./App') : import('./Overlay')
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <AppComponent />
      </Suspense>
  </QueryClientProvider>
)
