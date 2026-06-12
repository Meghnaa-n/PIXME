'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

interface Props { onStart: () => void }

const PASTELS = [
  'rgba(180,150,255,0.78)','rgba(255,160,180,0.75)','rgba(140,210,180,0.75)',
  'rgba(255,200,120,0.75)','rgba(140,195,255,0.75)','rgba(255,170,200,0.72)',
  'rgba(170,220,160,0.72)','rgba(220,170,255,0.75)','rgba(255,225,140,0.72)',
]

function PastelCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -999, y: -999 })
  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    let raf: number
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY } }
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) mouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onTouch, { passive: true })
    const CELL = 56
    const makeTiles = () => Array.from({ length: Math.ceil(canvas.width/CELL)+2 }, (_,col) =>
      Array.from({ length: Math.ceil(canvas.height/CELL)+2 }, (_,row) => ({
        col, row,
        color: PASTELS[Math.floor(Math.random()*PASTELS.length)],
        phase: Math.random()*Math.PI*2,
        speed: 0.008+Math.random()*0.008,
        ox: 0, oy: 0,
      }))
    ).flat()
    let tiles = makeTiles()
    window.addEventListener('resize', () => { tiles = makeTiles() })
    let t = 0
    const draw = () => {
      const W=canvas.width, H=canvas.height
      ctx.fillStyle='#f5f0ff'; ctx.fillRect(0,0,W,H)
      tiles.forEach(tile => {
        const bx=tile.col*CELL, by=tile.row*CELL
        const cx=bx+CELL/2, cy=by+CELL/2
        const dx=mouse.current.x-cx, dy=mouse.current.y-cy
        const dist=Math.sqrt(dx*dx+dy*dy)
        const repel=Math.max(0,1-dist/140)*14
        tile.ox+=(-dx/(dist||1)*repel-tile.ox)*0.12
        tile.oy+=(-dy/(dist||1)*repel-tile.oy)*0.12
        const wave=Math.sin(t*tile.speed+tile.phase)*3
        ctx.save()
        ctx.globalAlpha=0.68+Math.sin(t*tile.speed+tile.phase)*0.2
        ctx.fillStyle=tile.color
        ctx.beginPath()
        ctx.roundRect(bx+tile.ox+2, by+tile.oy+wave+2, CELL-4, CELL-4, 7)
        ctx.fill()
        ctx.restore()
      })
      t++; raf=requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [])
  return <canvas ref={ref} style={{ position:'absolute', inset:0 }} />
}

function PixmeLogo({ size=72 }: { size?: number }) {
  const controls = useAnimation()
  const [meColor, setMeColor] = useState('#9d8ff8')
  const handleClick = async () => {
    setMeColor('#f0b8d4')
    await controls.start({ scale:[1,1.22,0.88,1.08,1], rotate:[0,-6,6,-2,0], transition:{duration:0.5} })
    setTimeout(() => setMeColor('#9d8ff8'), 600)
  }
  return (
    <div style={{ display:'flex', alignItems:'baseline', userSelect:'none' }}>
      <span style={{ fontSize:size, fontWeight:900, letterSpacing:-4, color:'#3d2e6b', lineHeight:1, fontStyle:'italic' }}>PIX</span>
      <motion.span animate={controls} onClick={handleClick}
        style={{ fontSize:size, fontWeight:900, letterSpacing:-4, color:meColor, lineHeight:1, fontStyle:'italic', cursor:'pointer', display:'inline-block', transition:'color .3s' }}>
        ME
      </motion.span>
    </div>
  )
}

function MagneticButton({ onClick, label }: { onClick:()=>void; label:string }) {
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x:0, y:0 })
  return (
    <motion.button ref={ref} onClick={onClick}
      onMouseMove={e=>{const r=ref.current!.getBoundingClientRect();setPos({x:(e.clientX-r.left-r.width/2)*0.28,y:(e.clientY-r.top-r.height/2)*0.28})}}
      onMouseLeave={()=>setPos({x:0,y:0})}
      animate={{ x:pos.x, y:pos.y }}
      transition={{ type:'spring', stiffness:300, damping:20 }}
      whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }}
      style={{ padding:'16px 48px', borderRadius:99, border:'none', background:'linear-gradient(135deg,#c4b0ff,#f0b8d4,#b8e6d4)', color:'#2d1f5e', fontSize:17, fontWeight:800, cursor:'pointer', letterSpacing:-0.3, boxShadow:'0 8px 40px rgba(180,150,255,0.45)', fontFamily:'inherit' }}>
      {label}
    </motion.button>
  )
}

export default function LandingPage({ onStart }: Props) {
  return (
    <div style={{ position:'relative', width:'100vw', height:'100vh', overflow:'hidden', background:'#f5f0ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <PastelCanvas />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,rgba(245,240,255,0.42) 0%,rgba(245,240,255,0.65) 60%,rgba(245,240,255,0.88) 100%)', pointerEvents:'none' }} />
      <div style={{ position:'relative', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:24, padding:'0 24px' }}>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.7}}>
          <PixmeLogo size={72} />
        </motion.div>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5,duration:0.8}}
          style={{ margin:0, fontSize:16, color:'#7a6e9a', fontWeight:400, lineHeight:1.7, maxWidth:340 }}>
          Turn your photos into living mosaics.<br/>
          <span style={{color:'#b0a0d0'}}>Made from memories, sent with love.</span>
        </motion.p>
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.75,duration:0.6}}>
          <MagneticButton onClick={onStart} label='Start Creating ✦' />
        </motion.div>
        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.1}}
          style={{ margin:0, fontSize:12, color:'#c0b8d8' }}>
          No account needed · Runs in your browser
        </motion.p>
      </div>
    </div>
  )
}
