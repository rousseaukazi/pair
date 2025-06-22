
'use client';

import SplitView from './components/SplitView';
import { AppProvider } from './context/AppContext';

export default function Home() {
  return (
    <AppProvider>
      <main className="h-screen w-screen overflow-hidden">
        <SplitView />
      </main>
    </AppProvider>
  );
}
