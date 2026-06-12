'use client'
import { useState } from 'react'
import LandingPage from './landing'
import UploadPage from './upload'
import StudioPage from './studio'
import MemoryPage from './memory'

export type AppView = 'landing' | 'upload' | 'studio' | 'memory'
export interface MosaicData { dataUrl: string; sourceCount: number }

export default function App() {
  const [view, setView] = useState<AppView>('landing')
  const [mosaic, setMosaic] = useState<MosaicData | null>(null)

  return (
    <>
      {view === 'landing' && <LandingPage onStart={() => setView('upload')} />}
      {view === 'upload'  && <UploadPage  onBack={() => setView('landing')} onDone={() => setView('studio')} />}
      {view === 'studio'  && <StudioPage  onBack={() => setView('upload')}  onSendMemory={(d,n) => { setMosaic({dataUrl:d,sourceCount:n}); setView('memory') }} />}
      {view === 'memory'  && mosaic && <MemoryPage mosaicDataUrl={mosaic.dataUrl} sourceCount={mosaic.sourceCount} onBack={() => setView('studio')} />}
    </>
  )
}
