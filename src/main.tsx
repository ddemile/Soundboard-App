import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getCurrentWindow } from "@tauri-apps/api/window"
import ReactDOM from 'react-dom/client'
import './index.css'
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './components/theme-provider';
import Spinner from './components/Spinner';

const queryClient = new QueryClient()
const { label } = getCurrentWindow()

const AppComponent = lazy(() =>
  label === "main" ? import('./App') : import('./Overlay')
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme='system' storageKey="vite-ui-theme">
      <Suspense fallback={<div className='w-screen h-screen bg-white dark:bg-[#181818] flex justify-center items-center'><Spinner /></div>}>
        <AppComponent />
      </Suspense>
    </ThemeProvider>
  </QueryClientProvider>
)
