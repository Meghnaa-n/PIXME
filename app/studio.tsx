'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, X, Gift, SlidersHorizontal, Flame, GitCompare, Layers, ChevronUp, ChevronDown } from 'lucide-react'
import { globalSources } from './upload'

interface SourceImage { img:HTMLImageElement; avgR:number; avgG:number; avgB:number; name:string }
interface TileMatch   { x:number; y:number; sourceIdx:number; similarity:number }
type RevealMode  = 'wave'|'spiral'|'random'|'row'
type ViewMode    = 'normal'|'heatmap'|'compare'
type DensityMode = 'low'|'medium'|'high'|'ultra'
type Stage       = 'idle'|'processing'|'done'

const DENSITY_MAP:Record<DensityMode,number> = { low:900, medium:2500, high:5000, ultra:9000 }
const STAGE_LABELS = ['Analyzing images…','Matching tiles…','Building mosaic…','Finalizing…']
const PASTELS_BG = ['rgba(198,182,255,0.2)','rgba(255,182,193,0.18)','rgba(182,230,210,0.18)','rgba(255,218,170,0.18)','rgba(182,215,255,0.18)']
const EXPORT_W = 5760, EXPORT_H = 3840

function heatColor(s:number){ return s>0.82?'rgba(100,210,150,0.85)':s>0.65?'rgba(255,190,80,0.85)':'rgba(255,100,100,0.85)' }
function getAvgRGB(img:HTMLImageElement){
  const sz=64,c=document.createElement('canvas');c.width=sz;c.height=sz
  const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0,sz,sz)
  const d=ctx.getImageData(0,0,sz,sz).data;let r=0,g=0,b=0;const px=sz*sz
  for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2]}
  return{r:r/px,g:g/px,b:b/px}
}
function rgbDist(r1:number,g1:number,b1:number,r2:number,g2:number,b2:number){return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2)}
function simScore(d:number){return Math.max(0,1-d/441)}
function buildOrder(cols:number,rows:number,mode:RevealMode){
  const cells=Array.from({length:rows},(_,y)=>Array.from({length:cols},(_,x)=>({x,y}))).flat()
  if(mode==='random'){for(let i=cells.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]]}}
  else if(mode==='wave'){cells.sort((a,b)=>Math.hypot(a.x-cols/2,a.y-rows/2)-Math.hypot(b.x-cols/2,b.y-rows/2))}
  else if(mode==='spiral'){
    const out:typeof cells=[];let top=0,bot=rows-1,left=0,right=cols-1
    while(top<=bot&&left<=right){
      for(let c=left;c<=right;c++)out.push({x:c,y:top});top++
      for(let r=top;r<=bot;r++)out.push({x:right,y:r});right--
      if(top<=bot){for(let c=right;c>=left;c--)out.push({x:c,y:bot});bot--}
      if(left<=right){for(let r=bot;r>=top;r--)out.push({x:left,y:r});left++}
    }
    return out
  }
  return cells
}
function gridFromCount(n:number){const ratio=3/2;const rows=Math.round(Math.sqrt(n/ratio));const cols=Math.round(rows*ratio);return{cols:Math.max(1,cols),rows:Math.max(1,rows)}}

const CW=760,CH=507
interface Props { onBack:()=>void; onSendMemory:(dataUrl:string,count:number)=>void }

export default function StudioPage({onBack,onSendMemory}:Props) {
  const [sources,     setSources]     = useState<SourceImage[]>([])
  const [srcLoading,  setSrcLoading]  = useState(true)
  const [srcPct,      setSrcPct]      = useState(0)
  const [targetImg,   setTargetImg]   = useState<HTMLImageElement|null>(null)
  const [density,     setDensity]     = useState<DensityMode>('medium')
  const [revealMode,  setRevealMode]  = useState<RevealMode>('wave')
  const [viewMode,    setViewMode]    = useState<ViewMode>('normal')
  const [appStage,    setAppStage]    = useState<Stage>('idle')
  const [progress,    setProgress]    = useState(0)
  const [stageLabel,  setStageLabel]  = useState('')
  const [tiles,       setTiles]       = useState<TileMatch[]>([])
  const [snapshots,   setSnapshots]   = useState<string[]>([])
  const [scrubIdx,    setScrubIdx]    = useState(0)
  const [inspected,   setInspected]   = useState<TileMatch|null>(null)
  const [showPanel,   setShowPanel]   = useState(true)
  const [showTimeline,setShowTimeline]= useState(false)
  const [compareX,    setCompareX]    = useState(50)
  const [isMobile,    setIsMobile]    = useState(false)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const offRef       = useRef<HTMLCanvasElement>(null)
  const tilesRef     = useRef<TileMatch[]>([])
  const sourcesRef   = useRef<SourceImage[]>([])
  const snapRef      = useRef<string[]>([])
  const intervalRef  = useRef<ReturnType<typeof setInterval>|null>(null)
  const canvasWrapRef= useRef<HTMLDivElement>(null)

  const tileCount = DENSITY_MAP[density]
  const {cols,rows} = gridFromCount(tileCount)
  const tw=CW/cols, th=CH/rows

  useEffect(()=>{
    const check = () => setIsMobile(window.innerWidth < 640)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  },[])

  useEffect(()=>{
    try{
      const stored=sessionStorage.getItem('pixme_target')
      if(stored){
        const img=new Image()
        img.onload=()=>{
          setTargetImg(img)
          const off=offRef.current!; off.width=CW; off.height=CH
          off.getContext('2d')!.drawImage(img,0,0,CW,CH)
          canvasRef.current!.getContext('2d')!.drawImage(img,0,0,CW,CH)
        }
        img.src=stored
      }
    }catch{}
    const files=globalSources.files
    if(!files.length){ setSrcLoading(false); return }
    let loaded=0; const result:SourceImage[]=[]
    files.forEach(file=>{
      const url=URL.createObjectURL(file); const img=new Image()
      img.onload=()=>{
        const{r,g,b}=getAvgRGB(img)
        result.push({img,avgR:r,avgG:g,avgB:b,name:file.name})
        URL.revokeObjectURL(url); loaded++
        setSrcPct(Math.round(loaded/files.length*100))
        if(loaded===files.length){ sourcesRef.current=result; setSources(result); setSrcLoading(false) }
      }
      img.src=url
    })
  },[])

  const generate=useCallback(()=>{
    if(!targetImg||sourcesRef.current.length===0||appStage==='processing') return
    if(intervalRef.current) clearInterval(intervalRef.current)
    setAppStage('processing'); setProgress(0); setShowPanel(false)
    tilesRef.current=[]; setTiles([]); snapRef.current=[]; setSnapshots([]); setStageLabel(STAGE_LABELS[0])
    const canvas=canvasRef.current!; const ctx=canvas.getContext('2d')!
    ctx.clearRect(0,0,CW,CH)
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'
    const{cols,rows}=gridFromCount(tileCount); const tw=CW/cols,th=CH/rows
    const offCtx=offRef.current!.getContext('2d')!; const targetData=offCtx.getImageData(0,0,CW,CH)
    const tileTargets:{r:number,g:number,b:number}[]=[]
    for(let ty=0;ty<rows;ty++) for(let tx=0;tx<cols;tx++){
      let r=0,g=0,b=0,count=0
      const x0=Math.floor(tx*tw),y0=Math.floor(ty*th),x1=Math.min(CW,Math.floor((tx+1)*tw)),y1=Math.min(CH,Math.floor((ty+1)*th))
      for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){const i=(y*CW+x)*4;r+=targetData.data[i];g+=targetData.data[i+1];b+=targetData.data[i+2];count++}
      tileTargets.push(count>0?{r:r/count,g:g/count,b:b/count}:{r:200,g:190,b:220})
    }
    const srcs=sourcesRef.current
    const matches:TileMatch[]=tileTargets.map(({r,g,b},idx)=>{
      let best=0,bestDist=Infinity
      srcs.forEach((s,i)=>{const d=rgbDist(r,g,b,s.avgR,s.avgG,s.avgB);if(d<bestDist){bestDist=d;best=i}})
      return{x:idx%cols,y:Math.floor(idx/cols),sourceIdx:best,similarity:simScore(bestDist)}
    })
    const order=buildOrder(cols,rows,revealMode); const total=order.length; let i=0
    const snap=()=>{const url=canvas.toDataURL('image/jpeg',0.4);snapRef.current.push(url);setSnapshots(s=>[...s,url]);setScrubIdx(snapRef.current.length-1)}
    snap()
    intervalRef.current=setInterval(()=>{
      const batch=Math.max(1,Math.floor(total/180))
      for(let b=0;b<batch&&i<total;b++,i++){
        const{x,y}=order[i]; const tm=matches.find(m=>m.x===x&&m.y===y)!
        tilesRef.current.push(tm)
        ctx.drawImage(srcs[tm.sourceIdx].img,tm.x*tw,tm.y*th,tw,th)
      }
      const pct=Math.round(i/total*100); setProgress(pct); setTiles([...tilesRef.current])
      setStageLabel(STAGE_LABELS[Math.min(3,Math.floor(pct/25))])
      if(i%Math.max(1,Math.floor(total/8))===0) snap()
      if(i>=total){clearInterval(intervalRef.current!);snap();setAppStage('done');setStageLabel('')}
    },16)
  },[targetImg,appStage,tileCount,revealMode])

  const handleSendMemory=useCallback(()=>{
    if(!tilesRef.current.length) return
    const ec=document.createElement('canvas'); ec.width=EXPORT_W; ec.height=EXPORT_H
    const ectx=ec.getContext('2d')!
    ectx.imageSmoothingEnabled=true; ectx.imageSmoothingQuality='high'
    ectx.clearRect(0,0,EXPORT_W,EXPORT_H)
    const{cols}=gridFromCount(tileCount); const etw=EXPORT_W/cols,eth=EXPORT_H/gridFromCount(tileCount).rows
    tilesRef.current.forEach(tm=>ectx.drawImage(sourcesRef.current[tm.sourceIdx].img,tm.x*etw,tm.y*eth,etw,eth))
    onSendMemory(ec.toDataURL('image/jpeg',0.97),tileCount)
  },[tileCount,onSendMemory])

  const onCanvasClick=useCallback((e:React.MouseEvent<HTMLCanvasElement>)=>{
    if(!tilesRef.current.length) return
    const rect=canvasRef.current!.getBoundingClientRect()
    const scaleX=CW/rect.width, scaleY=CH/rect.height
    const px=(e.clientX-rect.left)*scaleX, py=(e.clientY-rect.top)*scaleY
    const{cols}=gridFromCount(tileCount); const tw=CW/cols,th=CH/rows
    const tm=tilesRef.current.find(t=>t.x===Math.floor(px/tw)&&t.y===Math.floor(py/th))
    if(tm) setInspected(tm)
  },[tileCount,rows])

  const scrubTo=useCallback((idx:number)=>{
    setScrubIdx(idx); const img=new Image()
    img.onload=()=>canvasRef.current!.getContext('2d')!.drawImage(img,0,0,CW,CH)
    img.src=snapshots[idx]
  },[snapshots])

  const insp=inspected?sourcesRef.current[inspected.sourceIdx]:null

  return(
    <div style={{background:'#f5f0ff',width:'100vw',height:'100vh',overflow:'hidden',display:'flex',flexDirection:'column',color:'#2d1f5e',position:'relative'}}>
      <canvas ref={offRef} style={{display:'none'}}/>

      {/* ── TOP NAV ── */}
      <div style={{height:52,background:'rgba(255,255,255,0.9)',borderBottom:'1px solid rgba(198,182,255,0.2)',display:'flex',alignItems:'center',padding:'0 10px',gap:6,backdropFilter:'blur(16px)',flexShrink:0,zIndex:80}}>
        <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:99,border:'1px solid rgba(180,150,255,0.25)',background:'rgba(198,182,255,0.1)',color:'#7a6e9a',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0}}>
          <ArrowLeft size={13}/>
          {!isMobile && ' Back'}
        </button>
        <span style={{fontWeight:900,fontSize:16,letterSpacing:-1,color:'#3d2e6b',fontStyle:'italic',flexShrink:0}}>
          PIX<span style={{color:'#9d8ff8'}}>ME</span>
        </span>

        {/* view mode — icons only on mobile */}
        <div style={{display:'flex',gap:3,marginLeft:4}}>
          {([
            ['normal',  <Layers size={12}/>,   'Mosaic',  'linear-gradient(135deg,#a890f0,#c4b0ff)','rgba(198,182,255,0.15)','#9d8fc0'],
            ['heatmap', <Flame size={12}/>,    'Heatmap', 'linear-gradient(135deg,#ff7f7f,#ffb347)','rgba(255,180,100,0.12)','#e07030'],
            ['compare', <GitCompare size={12}/>,'Compare','linear-gradient(135deg,#68b8a8,#84dcc6)','rgba(100,200,180,0.12)','#2a9080'],
          ] as [ViewMode,React.ReactNode,string,string,string,string][]).map(([m,icon,label,activeBg,inactiveBg,inactiveColor])=>(
            <motion.button key={m} whileHover={{scale:1.06,y:-1}} whileTap={{scale:0.95}} onClick={()=>setViewMode(m)}
              style={{display:'flex',alignItems:'center',gap:isMobile?0:4,padding:isMobile?'6px 8px':'5px 11px',borderRadius:20,fontSize:11,fontWeight:700,border:'none',cursor:'pointer',background:viewMode===m?activeBg:inactiveBg,color:viewMode===m?'#fff':inactiveColor,boxShadow:viewMode===m?'0 4px 12px rgba(0,0,0,0.12)':'none',transition:'all .2s',flexShrink:0}}>
              {icon}{!isMobile&&<span style={{marginLeft:3}}>{label}</span>}
            </motion.button>
          ))}
        </div>

        <div style={{marginLeft:'auto',display:'flex',gap:5,alignItems:'center',flexShrink:0}}>
          {appStage==='done'&&(
            <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}} onClick={handleSendMemory}
              style={{display:'flex',alignItems:'center',gap:5,padding:isMobile?'7px 10px':'7px 14px',borderRadius:99,border:'none',background:'linear-gradient(135deg,#c4b0ff,#f0b8d4)',color:'#2d1f5e',fontSize:12,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 16px rgba(180,150,255,0.35)'}}>
              <Gift size={13}/>{!isMobile&&'Send Memory ✦'}
              {isMobile&&'Send ✦'}
            </motion.button>
          )}
          {appStage!=='done'&&(
            <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
              onClick={generate} disabled={!targetImg||sources.length===0||appStage==='processing'||srcLoading}
              style={{padding:'7px 14px',borderRadius:99,border:'none',background:targetImg&&sources.length>0&&!srcLoading&&appStage!=='processing'?'linear-gradient(135deg,#c4b0ff,#f0b8d4)':'rgba(198,182,255,0.2)',color:targetImg&&sources.length>0&&!srcLoading&&appStage!=='processing'?'#2d1f5e':'#b0a8c8',fontSize:12,fontWeight:800,cursor:'pointer',transition:'all .2s'}}>
              {appStage==='processing'?`${progress}%`:'Generate ✦'}
            </motion.button>
          )}
        </div>
      </div>

      {/* source loading bar */}
      <AnimatePresence>
        {srcLoading&&(
          <motion.div initial={{height:0,opacity:0}} animate={{height:36,opacity:1}} exit={{height:0,opacity:0}}
            style={{background:'rgba(198,182,255,0.1)',borderBottom:'1px solid rgba(198,182,255,0.18)',display:'flex',alignItems:'center',padding:'0 14px',gap:10,flexShrink:0,overflow:'hidden'}}>
            <div style={{flex:1,height:4,background:'rgba(198,182,255,0.2)',borderRadius:2,overflow:'hidden'}}>
              <motion.div animate={{width:`${srcPct}%`}} transition={{duration:0.15}}
                style={{height:'100%',background:'linear-gradient(90deg,#c4b0ff,#f0b8d4)',borderRadius:2}}/>
            </div>
            <span style={{fontSize:11,color:'#9d8fc0',fontWeight:600,whiteSpace:'nowrap'}}>Loading {srcPct}%</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CANVAS ── */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',background:'linear-gradient(135deg,#ede8ff 0%,#ffeef5 35%,#eafff6 70%,#fff8e8 100%)',overflow:'hidden'}}>
        {PASTELS_BG.map((c,i)=>(
          <motion.div key={i} animate={{x:[0,20,-10,0],y:[0,-15,10,0],scale:[1,1.05,0.97,1]}}
            transition={{duration:8+i*2,repeat:Infinity,ease:'easeInOut',delay:i*1.2}}
            style={{position:'absolute',borderRadius:'50%',background:c,width:200+i*60,height:160+i*40,left:`${[10,30,55,70,20][i]}%`,top:`${[15,55,20,65,40][i]}%`,transform:'translate(-50%,-50%)',filter:'blur(40px)',pointerEvents:'none'}}/>
        ))}

        <div ref={canvasWrapRef} style={{position:'relative',borderRadius:isMobile?8:14,overflow:'hidden',boxShadow:'0 20px 60px rgba(180,150,255,0.18)',zIndex:2,maxWidth:'calc(100vw - 20px)',width:isMobile?'100%':'auto'}}>
          <canvas ref={canvasRef} width={CW} height={CH} onClick={onCanvasClick}
            style={{display:'block',cursor:'crosshair',width:'100%',maxHeight:isMobile?'calc(100vh - 220px)':'calc(100vh - 180px)',objectFit:'contain'}}/>

          {viewMode==='heatmap'&&tiles.length>0&&(
            <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
              {tiles.map((t,i)=>(
                <div key={i} style={{position:'absolute',left:`${(t.x/cols)*100}%`,top:`${(t.y/rows)*100}%`,width:`${100/cols}%`,height:`${100/rows}%`,background:heatColor(t.similarity)}}/>
              ))}
            </div>
          )}

          {viewMode==='compare'&&(
            <>
              <canvas ref={el=>{if(el&&offRef.current){el.width=CW;el.height=CH;el.getContext('2d')!.drawImage(offRef.current,0,0)}}}
                style={{position:'absolute',inset:0,clipPath:`inset(0 ${100-compareX}% 0 0)`,pointerEvents:'none',opacity:0.92,width:'100%',height:'100%'}}/>
              <div style={{position:'absolute',top:0,bottom:0,left:`${compareX}%`,width:2,background:'rgba(180,150,255,0.9)',boxShadow:'0 0 12px rgba(180,150,255,0.5)',pointerEvents:'none'}}/>
              <input type='range' min={0} max={100} value={compareX} onChange={e=>setCompareX(Number(e.target.value))}
                style={{position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',width:'70%',accentColor:'#9d8ff8',zIndex:10}}/>
            </>
          )}

          {/* GENERATION PROGRESS */}
          <AnimatePresence>
            {appStage==='processing'&&(
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',pointerEvents:'none'}}>
                <motion.div animate={{top:['0%','100%']}} transition={{duration:1.8,repeat:Infinity,ease:'linear'}}
                  style={{position:'absolute',left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,rgba(198,182,255,0.9),transparent)',boxShadow:'0 0 18px rgba(180,150,255,0.6)',pointerEvents:'none'}}/>
                <div style={{width:'100%',padding:'14px 16px 16px',background:'linear-gradient(to top,rgba(245,240,255,0.92) 0%,transparent 100%)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:7}}>
                    <motion.span key={stageLabel} initial={{opacity:0,y:3}} animate={{opacity:1,y:0}}
                      style={{fontSize:12,color:'rgba(90,63,160,0.85)',fontWeight:700}}>{stageLabel}</motion.span>
                    <span style={{fontSize:16,fontWeight:900,color:'#7a6e9a'}}>{progress}%</span>
                  </div>
                  <div style={{height:8,background:'rgba(198,182,255,0.25)',borderRadius:4,overflow:'hidden'}}>
                    <motion.div animate={{width:`${progress}%`}} transition={{duration:0.2}}
                      style={{height:'100%',background:'linear-gradient(90deg,#c4b0ff,#f0b8d4,#b8e6d4)',borderRadius:4,boxShadow:'0 0 8px rgba(196,176,255,0.5)'}}/>
                  </div>
                  <div style={{fontSize:10,color:'rgba(120,100,180,0.6)',marginTop:4}}>
                    {Math.round(progress/100*tileCount).toLocaleString()} / {tileCount.toLocaleString()} tiles
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!targetImg&&(
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(245,240,255,0.94)',pointerEvents:'none'}}>
              <span style={{fontSize:13,color:'#b0a8c8',fontWeight:500,textAlign:'center',padding:'0 20px'}}>Upload images to begin</span>
            </div>
          )}
        </div>

        {/* ── BOTTOM TOOLBAR (replaces floating panels on mobile) ── */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:70}}>

          {/* Settings panel */}
          <AnimatePresence>
            {showPanel&&(
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
                style={{background:'rgba(255,255,255,0.96)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(198,182,255,0.3)',padding:'14px 16px',display:'flex',flexDirection:'column',gap:12,boxShadow:'0 -8px 30px rgba(180,150,255,0.12)'}}>
                <div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#9d8fc0',marginBottom:6}}>Tile Density</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                    {(['low','medium','high','ultra'] as DensityMode[]).map(m=>(
                      <button key={m} onClick={()=>setDensity(m)}
                        style={{padding:'8px 0',borderRadius:8,border:`1.5px solid ${density===m?'rgba(180,150,255,0.55)':'rgba(198,182,255,0.2)'}`,background:density===m?'linear-gradient(135deg,rgba(196,176,255,0.4),rgba(240,184,212,0.3))':'rgba(255,255,255,0.7)',color:density===m?'#5a3fa0':'#9d8fc0',fontSize:10,fontWeight:700,cursor:'pointer',textTransform:'capitalize'}}>
                        {m}<div style={{fontSize:7,opacity:0.65,marginTop:1}}>{DENSITY_MAP[m]>=1000?(DENSITY_MAP[m]/1000)+'k':DENSITY_MAP[m]}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:9,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#9d8fc0',marginBottom:6}}>Reveal Style</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
                    {(['wave','spiral','row','random'] as RevealMode[]).map(m=>(
                      <button key={m} onClick={()=>setRevealMode(m)}
                        style={{padding:'7px 4px',borderRadius:7,border:`1.5px solid ${revealMode===m?'rgba(180,150,255,0.45)':'rgba(198,182,255,0.18)'}`,background:revealMode===m?'rgba(196,176,255,0.28)':'rgba(255,255,255,0.6)',color:revealMode===m?'#5a3fa0':'#9d8fc0',fontSize:9,fontWeight:600,cursor:'pointer'}}>
                        {m==='row'?'Row':m.charAt(0).toUpperCase()+m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {targetImg&&sources.length>0&&appStage!=='processing'&&(
                  <button onClick={()=>{generate();setShowPanel(false)}}
                    style={{padding:'12px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#c4b0ff,#f0b8d4)',color:'#2d1f5e',fontSize:14,fontWeight:800,cursor:'pointer',boxShadow:'0 4px 14px rgba(180,150,255,0.3)'}}>
                    Generate Mosaic ✦
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tile inspector bottom sheet */}
          <AnimatePresence>
            {inspected&&insp&&(
              <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:30}}
                style={{background:'rgba(255,255,255,0.96)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(198,182,255,0.3)',padding:'12px 16px',boxShadow:'0 -8px 30px rgba(180,150,255,0.12)'}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                  <canvas width={72} height={72} ref={el=>{if(el&&insp){el.getContext('2d')!.drawImage(insp.img,0,0,72,72)}}}
                    style={{width:72,height:72,borderRadius:8,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:11,color:'#9d8fc0',lineHeight:2}}>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span>File</span><span style={{color:'#3d2e6b',fontWeight:600,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{insp.name}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span>Position</span><span style={{color:'#3d2e6b',fontWeight:600}}>({inspected.x},{inspected.y})</span></div>
                    <div style={{display:'flex',justifyContent:'space-between'}}><span>Match</span><span style={{color:'#7cba9a',fontWeight:700}}>{Math.round(inspected.similarity*100)}%</span></div>
                  </div>
                  <button onClick={()=>setInspected(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#b0a8c8',padding:4,flexShrink:0}}><X size={14}/></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timeline strip */}
          <AnimatePresence>
            {showTimeline&&snapshots.length>0&&(
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:10}}
                style={{background:'rgba(255,255,255,0.94)',backdropFilter:'blur(20px)',borderTop:'1px solid rgba(198,182,255,0.25)',padding:'8px 12px',display:'flex',gap:5,overflowX:'auto'}}>
                {snapshots.map((url,i)=>(
                  <div key={i} onClick={()=>scrubTo(i)}
                    style={{flexShrink:0,width:48,height:32,borderRadius:5,backgroundImage:`url(${url})`,backgroundSize:'cover',border:`1.5px solid ${scrubIdx===i?'#9d8ff8':'rgba(198,182,255,0.3)'}`,cursor:'pointer',boxShadow:scrubIdx===i?'0 0 6px rgba(157,143,248,0.4)':'none'}}/>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* bottom bar with icon buttons */}
          <div style={{background:'rgba(255,255,255,0.9)',borderTop:'1px solid rgba(198,182,255,0.18)',display:'flex',alignItems:'center',padding:'6px 12px',gap:8,backdropFilter:'blur(12px)'}}>
            <button onClick={()=>setShowPanel(v=>!v)}
              style={{display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:10,border:`1px solid ${showPanel?'rgba(180,150,255,0.4)':'rgba(198,182,255,0.25)'}`,background:showPanel?'rgba(198,182,255,0.18)':'rgba(255,255,255,0.7)',color:'#7a6e9a',fontSize:11,fontWeight:600,cursor:'pointer'}}>
              <SlidersHorizontal size={12}/> {!isMobile&&'Settings'}{isMobile&&(showPanel?<ChevronDown size={10}/>:<ChevronUp size={10}/>)}
            </button>
            {snapshots.length>0&&(
              <button onClick={()=>setShowTimeline(v=>!v)}
                style={{display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:10,border:`1px solid ${showTimeline?'rgba(180,150,255,0.4)':'rgba(198,182,255,0.25)'}`,background:showTimeline?'rgba(198,182,255,0.18)':'rgba(255,255,255,0.7)',color:'#7a6e9a',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                {showTimeline?<ChevronDown size={12}/>:<ChevronUp size={12}/>} Timeline
              </button>
            )}
            <span style={{fontSize:10,color:'#b0a8c8',marginLeft:'auto'}}>
              {srcLoading?`Loading ${srcPct}%`:appStage==='processing'?`${progress}%`:appStage==='done'?`✓ ${tileCount.toLocaleString()} tiles`:'Ready'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
