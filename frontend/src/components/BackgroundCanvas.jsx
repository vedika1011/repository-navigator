// BackgroundCanvas.jsx — Animated floating graph nodes canvas background
import { useEffect, useRef } from 'react'

function BackgroundCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let width = window.innerWidth
    let height = window.innerHeight

    canvas.width = width
    canvas.height = height

    // Node colors matching the app's type system
    const NODE_COLORS = [
      '#7c6af0', // accent violet
      '#58a6ff', // blue
      '#7ee787', // green
      '#d2a8ff', // purple
      '#ffa657', // orange
      '#79c0ff', // light blue
    ]

    // Create floating nodes — simplified for reduced noise
    const NODE_COUNT = 18
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2, // slower velocity (0.2)
      vy: (Math.random() - 0.5) * 0.2, // slower velocity (0.2)
      radius: Math.random() * 3 + 2,
      color: NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)],
      opacity: Math.random() * 0.14 + 0.06, // reduced node opacity (0.06 to 0.2)
      pulsePhase: Math.random() * Math.PI * 2,
    }))

    // Create edges between nearby nodes
    const MAX_EDGE_DISTANCE = 145 // reduced distance

    function draw() {
      ctx.clearRect(0, 0, width, height)

      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < MAX_EDGE_DISTANCE) {
            const edgeOpacity = (1 - dist / MAX_EDGE_DISTANCE) * 0.06 // reduced opacity factor (0.06)
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(124, 106, 240, ${edgeOpacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      const time = Date.now() * 0.001
      nodes.forEach(node => {
        const pulse = Math.sin(time + node.pulsePhase) * 0.3 + 0.7
        const r = node.radius * pulse

        // Outer glow
        const gradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, r * 3
        )
        gradient.addColorStop(0, node.color + Math.floor(node.opacity * 255 * 0.8).toString(16).padStart(2, '0'))
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fillStyle = node.color + Math.floor(node.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
    }

    function update() {
      nodes.forEach(node => {
        node.x += node.vx
        node.y += node.vy

        // Wrap around edges
        if (node.x < -10) node.x = width + 10
        if (node.x > width + 10) node.x = -10
        if (node.y < -10) node.y = height + 10
        if (node.y > height + 10) node.y = -10
      })
    }

    function loop() {
      update()
      draw()
      animationId = requestAnimationFrame(loop)
    }

    loop()

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.25, // reduced container opacity to 0.25
      }}
    />
  )
}

export default BackgroundCanvas
