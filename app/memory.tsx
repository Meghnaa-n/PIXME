'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { ArrowLeft, Download, Sparkles } from 'lucide-react'

type LetterStage = 'input'|'sealing'|'opening'|'share'

const DEFAULT_CAPTIONS = (tileCount: number) => [
  'Memories of You',
  `${tileCount.toLocaleString()} Tiles of You`,
  'Memories Shared Together',
]

interface Props { mosaicDataUrl:string; sourceCount:number; onBack:()=>void }

// ── Floating pastel particles background ──────────────────────────────────────
function ParticleBg() {
  const particles = Array.from({length:18},(_,i)=>({
    id:i,
    x: Math.random()*100,
    y: Math.random()*100,
    size: 6+Math.random()*14,
    color: ['rgba(198,182,255,0.5)','rgba(255,182,193,0.5)','rgba(182,230,210,0.45)','rgba(255,218,170,0.45)','rgba(182,215,255,0.45)'][i%5],
    duration: 4+Math.random()*6,
    delay: Math.random()*4,
  }))
  return (
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      {particles.map(p=>(
        <motion.div key={p.id}
          animate={{y:['0%','–8%','0%'],x:['0%','4%','0%'],opacity:[0.6,1,0.6],scale:[1,1.1,1]}}
          transition={{duration:p.duration,repeat:Infinity,ease:'easeInOut',delay:p.delay}}
          style={{position:'absolute',left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,borderRadius:'50%',background:p.color,filter:'blur(2px)'}}/>
      ))}
    </div>
  )
}

// ── Wax seal ──────────────────────────────────────────────────────────────────
function WaxSeal({size=64,pulse=false}:{size?:number;pulse?:boolean}){
  return(
    <motion.div animate={pulse?{scale:[1,1.15,0.94,1.06,1],rotate:[0,-8,8,-3,0]}:{}} transition={{duration:0.7}}>
      <svg viewBox='0 0 70 70' width={size} height={size}>
        <ellipse cx='35' cy='61' rx='17' ry='3.5' fill='rgba(0,0,0,0.12)'/>
        <circle cx='35' cy='34' r='22' fill='url(#wgfinal)'/>
        <circle cx='35' cy='34' r='22' fill='none' stroke='rgba(180,30,30,0.5)' strokeWidth='1.5'/>
        <ellipse cx='19' cy='50' rx='5' ry='8' fill='url(#wgfinal)' transform='rotate(-20,19,50)'/>
        <ellipse cx='51' cy='51' rx='4' ry='6' fill='url(#wgfinal)' transform='rotate(15,51,51)'/>
        <ellipse cx='28' cy='26' rx='7' ry='4' fill='rgba(255,255,255,0.2)' transform='rotate(-30,28,26)'/>
        <text x='35' y='40' textAnchor='middle' fontSize='15' fontWeight='700' fill='rgba(255,255,255,0.9)' fontFamily='serif'>✦</text>
        <defs>
          <radialGradient id='wgfinal' cx='40%' cy='35%' r='60%'>
            <stop offset='0%' stopColor='#c0392b'/>
            <stop offset='60%' stopColor='#8b1a1a'/>
            <stop offset='100%' stopColor='#5c0f0f'/>
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  )
}

// ── Kraft envelope ────────────────────────────────────────────────────────────
function KraftEnvelope({flapOpen,children}:{flapOpen:boolean;children?:React.ReactNode}){
  return(
    <div style={{position:'relative',width:320,height:224}}>
      <svg viewBox='0 0 320 224' width='320' height='224' style={{position:'absolute',inset:0,zIndex:1}}>
        <defs>
          <linearGradient id='kgfinal' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='#eddcba'/><stop offset='100%' stopColor='#c8a472'/></linearGradient>
          <linearGradient id='fgfinal' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='#e2c08a'/><stop offset='100%' stopColor='#c09050'/></linearGradient>
          <filter id='esfinal'><feDropShadow dx='0' dy='8' stdDeviation='14' floodColor='rgba(0,0,0,0.16)'/></filter>
        </defs>
        <rect x='0' y='38' width='320' height='186' rx='8' fill='url(#kgfinal)' filter='url(#esfinal)'/>
        <line x1='0' y1='224' x2='160' y2='143' stroke='rgba(140,90,30,0.2)' strokeWidth='1'/>
        <line x1='320' y1='224' x2='160' y2='143' stroke='rgba(140,90,30,0.16)' strokeWidth='1'/>
        <line x1='0' y1='38' x2='160' y2='143' stroke='rgba(140,90,30,0.14)' strokeWidth='1'/>
        <line x1='320' y1='38' x2='160' y2='143' stroke='rgba(140,90,30,0.14)' strokeWidth='1'/>
        <polygon points='0,224 160,146 320,224' fill='#bf9860'/>
      </svg>

      <AnimatePresence>
        {flapOpen&&children&&(
          <motion.div
            initial={{y:55,opacity:0}} animate={{y:-46,opacity:1}} exit={{y:55,opacity:0}}
            transition={{delay:0.35,duration:0.85,ease:[0.2,0,0.1,1]}}
            style={{position:'absolute',left:22,right:22,top:28,zIndex:15}}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* flap */}
      <motion.div
        style={{position:'absolute',top:0,left:0,width:320,height:112,transformOrigin:'top center',zIndex:flapOpen?4:18}}
        animate={{rotateX:flapOpen?-172:0}}
        transition={{duration:1,ease:[0.4,0,0.15,1]}}>
        <svg viewBox='0 0 320 112' width='320' height='112'>
          <polygon points='0,0 160,92 320,0' fill='url(#fgfinal)'/>
          <polygon points='50,0 160,74 210,0' fill='rgba(255,255,255,0.07)'/>
        </svg>
      </motion.div>
    </div>
  )
}

function LetterCard({name,caption}:{name:string;caption:string}){
  return(
    <div style={{background:'linear-gradient(145deg,#fdf8ee,#f5edda)',borderRadius:10,padding:'13px 15px',boxShadow:'0 4px 16px rgba(0,0,0,0.14)',border:'1px solid rgba(200,160,100,0.3)',fontFamily:'Georgia,serif'}}>
      <div style={{fontSize:9,color:'#a0805a',letterSpacing:1.2,textTransform:'uppercase',marginBottom:5}}>A memory for</div>
      <div style={{fontSize:18,fontWeight:700,color:'#2c1a0a',marginBottom:4,letterSpacing:-0.2}}>{name}</div>
      <div style={{width:30,height:1,background:'#c8a472',marginBottom:6}}/>
      <div style={{fontSize:11,color:'#7a5c3a',lineHeight:1.5}}>{caption}</div>
    </div>
  )
}

// ── Confetti burst on share ───────────────────────────────────────────────────
function Confetti({active}:{active:boolean}) {
  const pieces = Array.from({length:22},(_,i)=>({
    id:i,
    x: 40+Math.random()*20,
    tx: (Math.random()-0.5)*220,
    ty: -120-Math.random()*180,
    color:['#c4b0ff','#f0b8d4','#b8e6d4','#ffd8a8','#a8d8f0','#f0a8c4'][i%6],
    rotate: Math.random()*720-360,
    size: 5+Math.random()*6,
    delay: Math.random()*0.3,
  }))
  if(!active) return null
  return(
    <div style={{position:'absolute',top:'30%',left:'50%',transform:'translateX(-50%)',pointerEvents:'none',zIndex:20}}>
      {pieces.map(p=>(
        <motion.div key={p.id}
          initial={{x:0,y:0,opacity:1,rotate:0,scale:1}}
          animate={{x:p.tx,y:p.ty,opacity:0,rotate:p.rotate,scale:0.5}}
          transition={{duration:1.1+Math.random()*0.4,ease:'easeOut',delay:p.delay}}
          style={{position:'absolute',width:p.size,height:p.size,borderRadius:2,background:p.color}}/>
      ))}
    </div>
  )
}

export default function MemoryPage({mosaicDataUrl,sourceCount,onBack}:Props){
  const [name,         setName]         = useState('')
  const [captionIdx,   setCaptionIdx]   = useState(0)
  const [customCaption,setCustomCaption]= useState('')
  const [useCustom,    setUseCustom]    = useState(false)
  const [letterStage,  setLetterStage]  = useState<LetterStage>('input')
  const [showConfetti, setShowConfetti] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const captions = DEFAULT_CAPTIONS(sourceCount)
  const finalCaption = useCustom ? customCaption : captions[captionIdx]

  const handleSeal=async()=>{
    if(!name.trim()){inputRef.current?.focus();return}
    setLetterStage('sealing')
    await wait(900)
    setLetterStage('opening')
    await wait(1800)
    setLetterStage('share')
    setShowConfetti(true)
    setTimeout(()=>setShowConfetti(false),1500)
  }

  const handleDownload=()=>{
    const canvas=document.createElement('canvas'); const img=new Image()
    img.onload=()=>{
      canvas.width=img.width; canvas.height=img.height
      const ctx=canvas.getContext('2d')!; ctx.drawImage(img,0,0)
      const barH=Math.round(img.height*0.08)
      ctx.fillStyle='rgba(250,247,242,0.92)'; ctx.fillRect(0,img.height-barH,img.width,barH)
      const fs=Math.round(img.height*0.024)
      ctx.fillStyle='#2d1f5e'; ctx.font=`700 ${fs}px -apple-system,sans-serif`; ctx.textAlign='left'
      ctx.fillText(`To: ${name}`,Math.round(img.width*0.025),img.height-Math.round(barH*0.5))
      ctx.fillStyle='rgba(100,80,160,0.6)'; ctx.font=`400 ${Math.round(fs*0.7)}px -apple-system,sans-serif`; ctx.textAlign='right'
      ctx.fillText(finalCaption,img.width-Math.round(img.width*0.025),img.height-Math.round(barH*0.5))
      canvas.toBlob(async(blob)=>{
        if(!blob)return
        const fileName=`pixme-for-${name.toLowerCase().replace(/\s+/g,'-')}.png`
        // Use application/octet-stream so WhatsApp receives it as a document (no compression)
        const docFile=new File([blob],fileName,{type:'application/octet-stream'})
        // Mobile: Web Share API → triggers native share sheet (WhatsApp, Instagram, etc.)
        if(navigator.canShare&&navigator.canShare({files:[docFile]})){
          try{
            await navigator.share({files:[docFile],title:`A memory for ${name}`})
            return
          }catch(e){
            // user cancelled — fall through to download
            if((e as Error).name==='AbortError')return
          }
        }
        // Desktop fallback: just download the file
        const url=URL.createObjectURL(docFile)
        const a=document.createElement('a')
        a.href=url; a.download=fileName; a.click()
        URL.revokeObjectURL(url)
      },'image/png')
    }
    img.src=mosaicDataUrl
  }


  return(
    <div style={{width:'100vw',minHeight:'100vh',background:'linear-gradient(135deg,#f5f0ff 0%,#fff5f8 50%,#f0fff8 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',color:'#2d1f5e',position:'relative',overflow:'hidden',padding:'60px 16px 32px'}}>

      <ParticleBg/>

      {/* ambient blobs */}
      <div style={{position:'absolute',top:'10%',left:'15%',width:400,height:350,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(198,182,255,0.2) 0%,transparent 70%)',pointerEvents:'none',filter:'blur(20px)'}}/>
      <div style={{position:'absolute',bottom:'8%',right:'12%',width:350,height:280,borderRadius:'50%',background:'radial-gradient(ellipse,rgba(255,182,193,0.18) 0%,transparent 70%)',pointerEvents:'none',filter:'blur(20px)'}}/>

      {/* back — top left only */}
      <button onClick={onBack} style={{position:'fixed',top:16,left:16,display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:99,border:'1px solid rgba(198,182,255,0.35)',background:'rgba(255,255,255,0.65)',backdropFilter:'blur(12px)',color:'#9d8fc0',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',zIndex:50}}>
        <ArrowLeft size={13}/> Back
      </button>

      {/* brand */}
      <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:50}}>
        <span style={{fontSize:19,fontWeight:900,color:'#3d2e6b',letterSpacing:-0.8,fontStyle:'italic'}}>PIX<span style={{color:'#9d8ff8'}}>ME</span></span>
      </div>

      <Confetti active={showConfetti}/>

      <AnimatePresence mode='wait'>

        {/* ── INPUT ── */}
        {letterStage==='input'&&(
          <motion.div key='input' initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20,scale:0.97}} transition={{duration:0.55}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:22,width:'100%',maxWidth:420}}>

            <motion.div animate={{y:[0,-8,0]}} transition={{duration:3.5,repeat:Infinity,ease:'easeInOut'}}>
              <KraftEnvelope flapOpen={false}/>
            </motion.div>

            <div style={{textAlign:'center'}}>
              <h2 style={{margin:'0 0 5px',fontSize:22,fontWeight:800,color:'#2d1f5e',letterSpacing:-0.4}}>Send a Memory</h2>
              <p style={{margin:0,fontSize:13,color:'#9d8fc0',lineHeight:1.6}}>Who is this mosaic made for?</p>
            </div>

            {/* glassmorphism input card */}
            <div style={{width:'100%',background:'rgba(255,255,255,0.7)',backdropFilter:'blur(16px)',borderRadius:18,padding:'20px',border:'1px solid rgba(198,182,255,0.3)',boxShadow:'0 8px 32px rgba(180,150,255,0.12)',display:'flex',flexDirection:'column',gap:12}}>
              <input ref={inputRef} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSeal()}
                placeholder='Their name…'
                style={{width:'100%',padding:'12px 15px',borderRadius:11,border:'1.5px solid rgba(198,182,255,0.4)',background:'rgba(255,255,255,0.8)',color:'#2d1f5e',fontSize:16,fontWeight:500,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}/>

              <div>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:0.8,textTransform:'uppercase',color:'#9d8fc0',marginBottom:7}}>Choose a caption</div>
                <div style={{display:'flex',flexDirection:'column',gap:5}}>
                  {captions.map((c,i)=>(
                    <motion.button key={i} whileHover={{scale:1.01,x:2}} whileTap={{scale:0.99}}
                      onClick={()=>{setCaptionIdx(i);setUseCustom(false)}}
                      style={{padding:'9px 13px',borderRadius:9,border:`1.5px solid ${!useCustom&&captionIdx===i?'rgba(180,150,255,0.55)':'rgba(198,182,255,0.2)'}`,background:!useCustom&&captionIdx===i?'linear-gradient(135deg,rgba(198,182,255,0.22),rgba(240,184,212,0.15))':'rgba(255,255,255,0.6)',color:!useCustom&&captionIdx===i?'#5a3fa0':'#9d8fc0',fontSize:12,fontWeight:500,cursor:'pointer',textAlign:'left',fontFamily:'inherit',transition:'all .15s',display:'flex',alignItems:'center',gap:8}}>
                      {!useCustom&&captionIdx===i&&<Sparkles size={11} color='#9d8ff8'/>}
                      {c}
                    </motion.button>
                  ))}
                  <input value={customCaption} onChange={e=>{setCustomCaption(e.target.value);setUseCustom(true)}} placeholder='✏️  Or write your own…'
                    style={{padding:'9px 13px',borderRadius:9,border:`1.5px solid ${useCustom?'rgba(180,150,255,0.55)':'rgba(198,182,255,0.2)'}`,background:useCustom?'rgba(198,182,255,0.15)':'rgba(255,255,255,0.6)',color:'#2d1f5e',fontSize:12,outline:'none',fontFamily:'inherit'}}/>
                </div>
              </div>

              <motion.button whileHover={name.trim()?{scale:1.02,boxShadow:'0 10px 32px rgba(180,130,60,0.4)'}:{}} whileTap={{scale:0.98}}
                onClick={handleSeal} disabled={!name.trim()}
                style={{padding:'14px',borderRadius:12,border:'none',background:name.trim()?'linear-gradient(135deg,#d4a86a,#a07840)':'rgba(198,182,255,0.2)',color:name.trim()?'#fff':'#b0a8c8',fontSize:15,fontWeight:800,cursor:name.trim()?'pointer':'not-allowed',boxShadow:name.trim()?'0 8px 28px rgba(180,130,60,0.28)':'none',transition:'all .2s',fontFamily:'inherit',letterSpacing:0.2}}>
                Seal & Send ✦
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── SEALING ── */}
        {letterStage==='sealing'&&(
          <motion.div key='sealing' initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
            <motion.div
              animate={{y:[0,-8,0],rotate:[-1,1,-1]}}
              transition={{duration:1.5,repeat:Infinity,ease:'easeInOut'}}>
              <KraftEnvelope flapOpen={false}/>
            </motion.div>
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
              <p style={{fontSize:14,color:'#9d8fc0',letterSpacing:0.4,textAlign:'center'}}>Sealing your memory…</p>
            </motion.div>
          </motion.div>
        )}

        {/* ── OPENING ── */}
        {letterStage==='opening'&&(
          <motion.div key='opening' initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:1.04}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
            <KraftEnvelope flapOpen={true}>
              <LetterCard name={name} caption={finalCaption}/>
            </KraftEnvelope>
            <motion.p initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
              style={{fontSize:14,color:'#9d8fc0',letterSpacing:0.4}}>Opening your memory… ✦</motion.p>
          </motion.div>
        )}

        {/* ── SHARE ── */}
        {letterStage==='share'&&(
          <motion.div key='share' initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:0.65,ease:[0.2,0,0.1,1]}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:20,width:'100%',maxWidth:420}}>

            {/* mosaic preview card */}
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:0.1,duration:0.6,type:'spring',stiffness:120}}
              style={{position:'relative',width:'100%',borderRadius:18,overflow:'hidden',boxShadow:'0 30px 80px rgba(180,150,255,0.22),0 4px 20px rgba(0,0,0,0.07)',border:'1px solid rgba(198,182,255,0.35)'}}>
              <img src={mosaicDataUrl} alt='mosaic' style={{width:'100%',display:'block'}}/>
              {/* wax seal — centered on image top */}
              <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',zIndex:5}}>
                <WaxSeal size={44}/>
              </div>
              {/* name overlay */}
              <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'22px 16px 14px',background:'linear-gradient(to top,rgba(250,247,242,0.96),transparent)'}}>
                <div style={{fontSize:9,color:'rgba(140,110,60,0.9)',fontWeight:700,letterSpacing:1.2,textTransform:'uppercase',marginBottom:3,fontFamily:'Georgia,serif'}}>To</div>
                <div style={{fontSize:20,fontWeight:800,color:'#2d1f5e',letterSpacing:-0.3}}>{name}</div>
                <div style={{fontSize:11,color:'#9d8fc0',marginTop:2}}>{finalCaption}</div>
              </div>
            </motion.div>

            <div style={{textAlign:'center'}}>
              <motion.h2 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
                style={{margin:'0 0 4px',fontSize:20,fontWeight:800,color:'#2d1f5e',letterSpacing:-0.3}}>
                Ready to send ✦
              </motion.h2>
              <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
                style={{margin:0,fontSize:13,color:'#9d8fc0'}}>
                A mosaic of memories, sealed for {name}
              </motion.p>
            </div>

            {/* action buttons */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
              style={{display:'flex',flexDirection:'column',gap:8,width:'100%'}}>
              <motion.button whileHover={{scale:1.02,boxShadow:'0 8px 28px rgba(180,130,60,0.4)'}} whileTap={{scale:0.97}}
                onClick={handleDownload}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#d4a86a,#a07840)',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 6px 24px rgba(180,130,60,0.28)',fontFamily:'inherit'}}>
                <Download size={15}/>Download Memory PNG
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function wait(ms:number){return new Promise(r=>setTimeout(r,ms))}
