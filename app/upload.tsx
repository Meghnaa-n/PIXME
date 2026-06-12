'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Images, ArrowLeft, ArrowRight, CheckCircle, Sparkles, X, Search } from 'lucide-react'

const UNSPLASH_KEY = 'CxJ6HpNhuzQZhb74RYtaC-S9tnRDM39Gr4ANfPLZ3jU'

const PASTELS = [
  'rgba(198,182,255,0.4)','rgba(255,182,193,0.4)','rgba(182,230,210,0.4)',
  'rgba(255,218,170,0.4)','rgba(182,215,255,0.4)','rgba(255,200,220,0.4)',
  'rgba(210,240,200,0.38)','rgba(240,200,255,0.4)','rgba(255,240,180,0.38)',
]

function PastelBg() {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x:-999, y:-999 })
  useEffect(() => {
    const canvas=ref.current!; const ctx=canvas.getContext('2d')!
    let raf: number
    const resize=()=>{ canvas.width=window.innerWidth; canvas.height=window.innerHeight }
    resize(); window.addEventListener('resize',resize)
    const onMove=(e:MouseEvent)=>{ mouse.current={x:e.clientX,y:e.clientY} }
    window.addEventListener('mousemove',onMove)
    const CELL=52
    const tiles=Array.from({length:Math.ceil(1600/CELL)+2},(_,c)=>
      Array.from({length:Math.ceil(900/CELL)+2},(_,r)=>({
        col:c,row:r,color:PASTELS[Math.floor(Math.random()*PASTELS.length)],
        phase:Math.random()*Math.PI*2,speed:0.007+Math.random()*0.007,ox:0,oy:0,
      }))
    ).flat()
    let t=0
    const draw=()=>{
      const W=canvas.width,H=canvas.height
      ctx.fillStyle='#f5f0ff'; ctx.fillRect(0,0,W,H)
      tiles.forEach(tile=>{
        const bx=tile.col*CELL,by=tile.row*CELL
        const cx=bx+CELL/2,cy=by+CELL/2
        const dx=mouse.current.x-cx,dy=mouse.current.y-cy
        const dist=Math.sqrt(dx*dx+dy*dy)
        const rep=Math.max(0,1-dist/120)*12
        tile.ox+=(-dx/(dist||1)*rep-tile.ox)*0.1
        tile.oy+=(-dy/(dist||1)*rep-tile.oy)*0.1
        const wave=Math.sin(t*tile.speed+tile.phase)*2.5
        ctx.save(); ctx.globalAlpha=0.55+Math.sin(t*tile.speed+tile.phase)*0.18
        ctx.fillStyle=tile.color
        ctx.beginPath()
        ctx.roundRect(bx+tile.ox+2,by+tile.oy+wave+2,CELL-4,CELL-4,5)
        ctx.fill(); ctx.restore()
      })
      t++; raf=requestAnimationFrame(draw)
    }
    draw()
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize); window.removeEventListener('mousemove',onMove) }
  },[])
  return <canvas ref={ref} style={{position:'absolute',inset:0}}/>
}

function GridUpload({ label, icon, title, sub, active, note, onFile, onFiles, accept, multiple }:{
  label:string; icon:React.ReactNode; title:string; sub:string; active:boolean; note?:string
  onFile:(f:File)=>void; onFiles:(f:FileList)=>void; accept:string; multiple:boolean
}) {
  const [mouse, setMouse] = useState({x:-999,y:-999})
  const ref = useRef<HTMLDivElement>(null)
  const COLS=10, ROWS=4
  const go=()=>{
    const inp=document.createElement('input'); inp.type='file'; inp.accept=accept; inp.multiple=multiple
    inp.onchange=(e:Event)=>{ const f=(e.target as HTMLInputElement).files; if(!f||!f.length)return; multiple?onFiles(f):onFile(f[0]) }
    inp.click()
  }
  return (
    <div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#9d8fc0',marginBottom:6}}>{label}</div>
      <div ref={ref} onClick={go}
        onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files;if(f.length){multiple?onFiles(f):onFile(f[0])}}}
        onDragOver={e=>e.preventDefault()}
        onMouseMove={e=>{const r=ref.current?.getBoundingClientRect();if(r)setMouse({x:e.clientX-r.left,y:e.clientY-r.top})}}
        onMouseLeave={()=>setMouse({x:-999,y:-999})}
        style={{position:'relative',borderRadius:12,overflow:'hidden',cursor:'pointer',border:`2px dashed ${active?'rgba(180,150,255,0.6)':'rgba(180,150,255,0.25)'}`,background:active?'rgba(198,182,255,0.1)':'rgba(255,255,255,0.5)',backdropFilter:'blur(8px)',height:100}}>
        <div style={{position:'absolute',inset:0,display:'grid',gridTemplateColumns:`repeat(${COLS},1fr)`,gridTemplateRows:`repeat(${ROWS},1fr)`,gap:1.5}}>
          {Array.from({length:COLS*ROWS}).map((_,idx)=>{
            const col=idx%COLS, row=Math.floor(idx/COLS)
            const cx=col*(440/COLS)+(440/COLS)/2, cy=row*(100/ROWS)+(100/ROWS)/2
            const dist=Math.sqrt((mouse.x-cx)**2+(mouse.y-cy)**2)
            const glow=Math.max(0,1-dist/80)
            return <div key={idx} style={{background:active?`rgba(180,150,255,${0.08+glow*0.28})`:`rgba(198,182,255,${glow*0.22})`,borderRadius:3,transition:'background .12s'}}/>
          })}
        </div>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',gap:12,padding:'0 16px'}}>
          <div style={{width:36,height:36,borderRadius:9,background:'rgba(198,182,255,0.22)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:active?'#5a3fa0':'#4a3870',marginBottom:1}}>{title}</div>
            <div style={{fontSize:11,color:'#9d8fc0'}}>{sub}</div>
            {note&&<div style={{fontSize:10,color:'#c0b0e0',marginTop:1}}>{note}</div>}
          </div>
          {active&&<CheckCircle size={17} color='#9d8ff8' style={{flexShrink:0}}/>}
        </div>
      </div>
    </div>
  )
}

export const globalSources: { files: File[] } = { files: [] }

// Extract dominant color keywords from target image for Unsplash search
function getDominantKeywords(img: HTMLImageElement): string[] {
  const c = document.createElement('canvas'); c.width = 100; c.height = 100
  const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0, 100, 100)
  const d = ctx.getImageData(0, 0, 100, 100).data
  let r=0,g=0,b=0; const px=100*100
  for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}
  r=r/px; g=g/px; b=b/px

  const keywords: string[] = []
  const max = Math.max(r,g,b)
  const min = Math.min(r,g,b)
  const brightness = (r+g+b)/3

  // tone-based keywords
  if (brightness > 180) keywords.push('bright', 'white', 'minimal')
  else if (brightness < 80) keywords.push('dark', 'night', 'moody')
  else keywords.push('nature', 'lifestyle', 'portrait')

  // hue-based keywords
  if (r > g+40 && r > b+40) keywords.push('red', 'orange', 'autumn', 'sunset')
  else if (g > r+40 && g > b+20) keywords.push('green', 'forest', 'nature', 'plants')
  else if (b > r+30 && b > g+20) keywords.push('blue', 'ocean', 'sky', 'water')
  else if (r > 160 && g > 140 && b < 100) keywords.push('golden', 'warm', 'desert', 'sand')
  else if (r > 160 && g < 120 && b > 160) keywords.push('purple', 'violet', 'flowers')
  else keywords.push('colorful', 'vibrant', 'texture', 'abstract')

  // always add variety keywords
  keywords.push('photography', 'art', 'travel', 'people')
  return [...new Set(keywords)]
}

interface UnsplashPhoto {
  id: string
  urls: { thumb: string; small: string; regular: string }
  alt_description: string
  color: string
}

interface Props { onBack:()=>void; onDone:()=>void }

export default function UploadPage({ onBack, onDone }: Props) {
  const [targetImg,      setTargetImg]      = useState<HTMLImageElement|null>(null)
  const [targetName,     setTargetName]     = useState('')
  const [sources,        setSources]        = useState<{name:string;color:string}[]>([])
  const [srcProcessing,  setSrcProcessing]  = useState(false)
  const [srcProgress,    setSrcProgress]    = useState(0)
  // suggestion system
  const [showSuggest,    setShowSuggest]    = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestions,    setSuggestions]    = useState<UnsplashPhoto[]>([])
  const [selected,       setSelected]       = useState<Set<string>>(new Set())
  const [importing,      setImporting]      = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [searchQuery,    setSearchQuery]    = useState('')

  const loadTarget = useCallback((file:File) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setTargetImg(img); setTargetName(file.name)
      const reader = new FileReader()
      reader.onload = () => { try { sessionStorage.setItem('pixme_target', reader.result as string) } catch{} }
      reader.readAsDataURL(file)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [])

  const loadSources = useCallback((files:FileList) => {
    const arr = Array.from(files)
    globalSources.files = arr
    setSrcProcessing(true); setSrcProgress(0); setSources([])
    const result:{name:string;color:string}[] = []
    let done = 0
    arr.forEach(file => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const c=document.createElement('canvas'); c.width=16; c.height=16
        const ctx=c.getContext('2d')!; ctx.drawImage(img,0,0,16,16)
        const d=ctx.getImageData(0,0,16,16).data
        let r=0,g=0,b=0; const px=16*16
        for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}
        result.push({name:file.name,color:`rgb(${Math.round(r/px)},${Math.round(g/px)},${Math.round(b/px)})`})
        URL.revokeObjectURL(url); done++
        setSrcProgress(Math.round(done/arr.length*100))
        if(done===arr.length){ setSources(result); setSrcProcessing(false) }
      }
      img.src=url
    })
  },[])

  // Fetch suggestions from Unsplash based on target image colors
  const fetchSuggestions = useCallback(async (query?: string) => {
    setSuggestLoading(true); setSuggestions([])
    const keywords = query
      ? [query]
      : targetImg ? getDominantKeywords(targetImg) : ['colorful', 'photography', 'nature']

    // fetch multiple pages across different keywords for variety
    const queries = query ? [query] : keywords.slice(0, 4)
    const perQuery = Math.ceil(200 / queries.length)
    const allPhotos: UnsplashPhoto[] = []

    await Promise.all(queries.map(async (kw) => {
      try {
        const pages = Math.ceil(perQuery / 30)
        for (let page = 1; page <= pages; page++) {
          const res = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(kw)}&per_page=30&page=${page}&order_by=relevant`,
            { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
          )
          if (!res.ok) break
          const data = await res.json()
          allPhotos.push(...(data.results || []))
        }
      } catch {}
    }))

    // deduplicate
    const seen = new Set<string>()
    const unique = allPhotos.filter(p => { if(seen.has(p.id))return false; seen.add(p.id); return true })
    setSuggestions(unique.slice(0, 200))
    setSuggestLoading(false)
  }, [targetImg])

  const openSuggest = useCallback(() => {
    setShowSuggest(true)
    setSelected(new Set())
    fetchSuggestions()
  }, [fetchSuggestions])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(suggestions.map(s=>s.id)))
  const clearAll  = () => setSelected(new Set())

  // Download selected Unsplash photos and use as source images
  const importSelected = useCallback(async () => {
    if (selected.size === 0) return
    setImporting(true); setImportProgress(0)
    const selectedPhotos = suggestions.filter(s => selected.has(s.id))
    const files: File[] = []
    let done = 0

    await Promise.all(selectedPhotos.map(async (photo) => {
      try {
        const res = await fetch(photo.urls.small)
        const blob = await res.blob()
        files.push(new File([blob], `unsplash-${photo.id}.jpg`, { type: 'image/jpeg' }))
      } catch {}
      done++
      setImportProgress(Math.round(done / selectedPhotos.length * 100))
    }))

    globalSources.files = files
    setSrcProcessing(true); setSrcProgress(0); setSources([])
    const result:{name:string;color:string}[] = []
    let processed = 0
    files.forEach(file => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const c=document.createElement('canvas'); c.width=16; c.height=16
        const ctx=c.getContext('2d')!; ctx.drawImage(img,0,0,16,16)
        const d=ctx.getImageData(0,0,16,16).data
        let r=0,g=0,b=0; const px=16*16
        for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}
        result.push({name:file.name,color:`rgb(${Math.round(r/px)},${Math.round(g/px)},${Math.round(b/px)})`})
        URL.revokeObjectURL(url); processed++
        setSrcProgress(Math.round(processed/files.length*100))
        if(processed===files.length){ setSources(result); setSrcProcessing(false) }
      }
      img.src=url
    })

    setImporting(false); setShowSuggest(false)
  }, [selected, suggestions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) fetchSuggestions(searchQuery.trim())
  }

  const canProceed = !!targetImg && sources.length > 0 && !srcProcessing && !importing

  return (
    <div style={{position:'relative',width:'100vw',minHeight:'100vh',overflow:'hidden',background:'#f5f0ff',fontFamily:'"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'}}>
      <PastelBg/>
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,rgba(245,240,255,0.5) 0%,rgba(245,240,255,0.72) 70%,rgba(245,240,255,0.9) 100%)',pointerEvents:'none'}}/>

      <button onClick={onBack} style={{position:'fixed',top:16,left:16,zIndex:60,display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:99,border:'1px solid rgba(180,150,255,0.3)',background:'rgba(255,255,255,0.65)',backdropFilter:'blur(12px)',color:'#7a6e9a',fontSize:13,fontWeight:600,cursor:'pointer'}}>
        <ArrowLeft size={14}/> Back
      </button>
      <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:60}}>
        <span style={{fontSize:20,fontWeight:900,color:'#3d2e6b',letterSpacing:-1,fontStyle:'italic'}}>PIX<span style={{color:'#9d8ff8'}}>ME</span></span>
      </div>

      {/* ── MAIN UPLOAD CARD ── */}
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'70px 16px 32px'}}>
        <motion.div initial={{opacity:0,y:24,scale:0.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.55}}
          style={{width:'100%',maxWidth:460,background:'rgba(255,255,255,0.78)',backdropFilter:'blur(20px)',borderRadius:20,padding:'26px 22px',boxShadow:'0 20px 60px rgba(180,150,255,0.15)',border:'1px solid rgba(198,182,255,0.3)',display:'flex',flexDirection:'column',gap:16}}>

          <div>
            <h2 style={{margin:'0 0 4px',fontSize:22,fontWeight:800,color:'#2d1f5e',letterSpacing:-0.5}}>Upload Your Images</h2>
            <p style={{margin:0,fontSize:13,color:'#9d8fc0',lineHeight:1.5}}>One target photo + source memories</p>
          </div>

          <GridUpload label='Target Image' icon={<Upload size={15} color='#9d8ff8'/>}
            title={targetImg?targetName:'Drop your main photo'} sub={targetImg?'Ready to recreate':'This image becomes the mosaic'}
            active={!!targetImg} onFile={loadTarget} onFiles={()=>{}} accept='image/*' multiple={false}/>

          <GridUpload label='Source Photos' icon={<Images size={15} color='#9d8ff8'/>}
            title={sources.length>0?`${sources.length} photos loaded`:'Drop your source photos'}
            sub={sources.length>0?'Click to replace':'These become the tiles'}
            note='50–150 photos works best'
            active={sources.length>0} onFile={()=>{}} onFiles={loadSources} accept='image/*' multiple={true}/>

          {/* ── SUGGESTION BUTTON ── */}
          {sources.length === 0 && !srcProcessing && (
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
              <div style={{textAlign:'center',marginBottom:8}}>
                <span style={{fontSize:11,color:'#b0a8c8'}}>— or —</span>
              </div>
              <motion.button whileHover={{scale:1.02,boxShadow:'0 8px 28px rgba(180,150,255,0.3)'}} whileTap={{scale:0.98}}
                onClick={openSuggest}
                style={{width:'100%',padding:'13px',borderRadius:12,border:'1.5px solid rgba(198,182,255,0.4)',background:'linear-gradient(135deg,rgba(198,182,255,0.15),rgba(240,184,212,0.1))',color:'#5a3fa0',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,backdropFilter:'blur(8px)'}}>
                <Sparkles size={16} color='#9d8ff8'/>
                Don't have photos? Get AI Suggestions
              </motion.button>
              <p style={{margin:'6px 0 0',fontSize:11,color:'#b0a8c8',textAlign:'center'}}>
                We'll find 200 images that match your target photo's colors
              </p>
            </motion.div>
          )}

          {/* source processing progress */}
          <AnimatePresence>
            {srcProcessing&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                style={{background:'rgba(198,182,255,0.1)',borderRadius:10,padding:'10px 12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:12,color:'#7a6e9a',fontWeight:600}}>Analyzing photos…</span>
                  <span style={{fontSize:12,fontWeight:700,color:'#9d8ff8'}}>{srcProgress}%</span>
                </div>
                <div style={{height:5,background:'rgba(198,182,255,0.2)',borderRadius:3,overflow:'hidden'}}>
                  <motion.div animate={{width:`${srcProgress}%`}} transition={{duration:0.15}}
                    style={{height:'100%',background:'linear-gradient(90deg,#c4b0ff,#f0b8d4)',borderRadius:3}}/>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* color swatches */}
          <AnimatePresence>
            {sources.length>0&&!srcProcessing&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}>
                <div style={{fontSize:10,fontWeight:600,letterSpacing:0.8,textTransform:'uppercase',color:'#9d8fc0',marginBottom:5}}>
                  Colour palette · {sources.length} photos
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
                  {sources.slice(0,60).map((s,i)=>(
                    <motion.div key={i} initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:i*0.008}}
                      title={s.name} style={{width:15,height:15,borderRadius:3,background:s.color,border:'1.5px solid rgba(255,255,255,0.7)',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}/>
                  ))}
                  {sources.length>60&&<div style={{width:15,height:15,borderRadius:3,background:'rgba(198,182,255,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,color:'#9d8ff8',fontWeight:700}}>+{sources.length-60}</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button onClick={onDone} disabled={!canProceed}
            whileHover={canProceed?{scale:1.02}:{}} whileTap={canProceed?{scale:0.98}:{}}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px',borderRadius:12,border:'none',background:canProceed?'linear-gradient(135deg,#c4b0ff,#f0b8d4)':'rgba(198,182,255,0.2)',color:canProceed?'#2d1f5e':'#b0a8c8',fontSize:15,fontWeight:800,cursor:canProceed?'pointer':'not-allowed',boxShadow:canProceed?'0 6px 24px rgba(180,150,255,0.3)':'none',transition:'all .2s'}}>
            {srcProcessing?'Processing…':'Continue to Studio'} {!srcProcessing&&canProceed&&<ArrowRight size={16}/>}
          </motion.button>
        </motion.div>
      </div>

      {/* ── SUGGESTION MODAL ── */}
      <AnimatePresence>
        {showSuggest&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,zIndex:100,background:'rgba(45,31,94,0.55)',backdropFilter:'blur(8px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}}
            onClick={e=>{if(e.target===e.currentTarget)setShowSuggest(false)}}>

            <motion.div initial={{y:'100%',opacity:0}} animate={{y:0,opacity:1}} exit={{y:'100%',opacity:0}}
              transition={{type:'spring',stiffness:280,damping:28}}
              style={{width:'100%',maxWidth:860,maxHeight:'90vh',background:'rgba(255,255,255,0.97)',backdropFilter:'blur(24px)',borderRadius:'20px 20px 0 0',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 -20px 60px rgba(180,150,255,0.2)'}}>

              {/* modal header */}
              <div style={{padding:'18px 20px 12px',borderBottom:'1px solid rgba(198,182,255,0.2)',flexShrink:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div>
                    <h3 style={{margin:0,fontSize:18,fontWeight:800,color:'#2d1f5e',letterSpacing:-0.3}}>
                      Suggested Photos ✦
                    </h3>
                    <p style={{margin:'3px 0 0',fontSize:12,color:'#9d8fc0'}}>
                      {suggestLoading?'Finding the best matches for your image…':`${suggestions.length} photos · select as many as you want`}
                    </p>
                  </div>
                  <button onClick={()=>setShowSuggest(false)} style={{background:'none',border:'none',cursor:'pointer',color:'#b0a8c8',padding:4}}>
                    <X size={20}/>
                  </button>
                </div>

                {/* search bar */}
                <form onSubmit={handleSearch} style={{display:'flex',gap:8}}>
                  <div style={{flex:1,position:'relative'}}>
                    <Search size={14} color='#b0a8c8' style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
                    <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                      placeholder='Search for specific themes (e.g. "sunset", "flowers", "city")…'
                      style={{width:'100%',padding:'9px 12px 9px 34px',borderRadius:10,border:'1.5px solid rgba(198,182,255,0.3)',background:'rgba(245,240,255,0.6)',color:'#2d1f5e',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <button type='submit' style={{padding:'9px 16px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#c4b0ff,#f0b8d4)',color:'#2d1f5e',fontSize:13,fontWeight:700,cursor:'pointer',flexShrink:0}}>
                    Search
                  </button>
                </form>

                {/* select controls */}
                {suggestions.length>0&&!suggestLoading&&(
                  <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10}}>
                    <button onClick={selectAll} style={{fontSize:12,color:'#9d8ff8',background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:0}}>Select all</button>
                    <span style={{color:'#d0c8e8'}}>·</span>
                    <button onClick={clearAll} style={{fontSize:12,color:'#9d8fc0',background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:0}}>Clear</button>
                    <span style={{marginLeft:'auto',fontSize:12,color:'#7a6e9a',fontWeight:600}}>
                      {selected.size} selected
                    </span>
                  </div>
                )}
              </div>

              {/* photo grid */}
              <div style={{flex:1,overflowY:'auto',padding:'12px 16px'}}>
                {suggestLoading&&(
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,gap:12}}>
                    <motion.div animate={{rotate:360}} transition={{duration:1.2,repeat:Infinity,ease:'linear'}}
                      style={{width:32,height:32,border:'3px solid rgba(198,182,255,0.3)',borderTop:'3px solid #9d8ff8',borderRadius:'50%'}}/>
                    <span style={{fontSize:13,color:'#9d8fc0'}}>Finding photos that match your image…</span>
                  </div>
                )}

                {!suggestLoading&&suggestions.length===0&&(
                  <div style={{textAlign:'center',padding:'40px 20px',color:'#b0a8c8',fontSize:14}}>
                    No results found. Try a different search term.
                  </div>
                )}

                {!suggestLoading&&suggestions.length>0&&(
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
                    {suggestions.map(photo=>(
                      <motion.div key={photo.id} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                        onClick={()=>toggleSelect(photo.id)}
                        style={{position:'relative',aspectRatio:'1',borderRadius:10,overflow:'hidden',cursor:'pointer',border:`2.5px solid ${selected.has(photo.id)?'#9d8ff8':'transparent'}`,boxShadow:selected.has(photo.id)?'0 0 0 1px rgba(157,143,248,0.4)':'none',transition:'all .15s'}}>
                        <img src={photo.urls.thumb} alt={photo.alt_description||'photo'}
                          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                        {/* selected overlay */}
                        <AnimatePresence>
                          {selected.has(photo.id)&&(
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                              style={{position:'absolute',inset:0,background:'rgba(157,143,248,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <div style={{width:22,height:22,borderRadius:'50%',background:'#9d8ff8',display:'flex',alignItems:'center',justifyContent:'center'}}>
                                <CheckCircle size={14} color='#fff'/>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* import footer */}
              <div style={{padding:'12px 20px',borderTop:'1px solid rgba(198,182,255,0.2)',flexShrink:0,background:'rgba(255,255,255,0.95)'}}>
                {importing&&(
                  <div style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:12,color:'#9d8fc0',fontWeight:600}}>Downloading photos…</span>
                      <span style={{fontSize:12,fontWeight:700,color:'#9d8ff8'}}>{importProgress}%</span>
                    </div>
                    <div style={{height:5,background:'rgba(198,182,255,0.2)',borderRadius:3,overflow:'hidden'}}>
                      <motion.div animate={{width:`${importProgress}%`}} transition={{duration:0.15}}
                        style={{height:'100%',background:'linear-gradient(90deg,#c4b0ff,#f0b8d4)',borderRadius:3}}/>
                    </div>
                  </div>
                )}
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <button onClick={()=>setShowSuggest(false)}
                    style={{padding:'10px 18px',borderRadius:10,border:'1px solid rgba(198,182,255,0.3)',background:'rgba(255,255,255,0.7)',color:'#9d8fc0',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    Cancel
                  </button>
                  <motion.button
                    whileHover={selected.size>0&&!importing?{scale:1.02}:{}} whileTap={{scale:0.97}}
                    onClick={importSelected} disabled={selected.size===0||importing}
                    style={{flex:1,padding:'12px',borderRadius:10,border:'none',background:selected.size>0&&!importing?'linear-gradient(135deg,#c4b0ff,#f0b8d4)':'rgba(198,182,255,0.2)',color:selected.size>0&&!importing?'#2d1f5e':'#b0a8c8',fontSize:14,fontWeight:800,cursor:selected.size>0&&!importing?'pointer':'not-allowed',boxShadow:selected.size>0&&!importing?'0 4px 16px rgba(180,150,255,0.3)':'none',transition:'all .2s'}}>
                    {importing?`Downloading ${importProgress}%`:`Use ${selected.size} Photo${selected.size!==1?'s':''} as Tiles`}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
