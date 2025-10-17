"use client"
import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
    interface Particle {
        x: number
        y: number
        vx: number
        vy: number
        size: number
        opacity: number
        color: string
    }

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const animationRef = useRef<number | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        const createParticles = () => {
            const particles: Particle[] = []
            const particleCount = Math.floor((canvas.width * canvas.height) / 12000)
            const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981"]

            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    size: Math.random() * 3 + 2,
                    opacity: Math.random() * 0.8 + 0.2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                })
            }

            particlesRef.current = particles
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particlesRef.current.forEach((particle, index) => {
                // Update position
                particle.x += particle.vx
                particle.y += particle.vy

                // Bounce off edges
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

                // Keep particles in bounds
                particle.x = Math.max(0, Math.min(canvas.width, particle.x))
                particle.y = Math.max(0, Math.min(canvas.height, particle.y))

                // Draw connections only between nearby particles (within reasonable distance)
                particlesRef.current.slice(index + 1).forEach((otherParticle) => {
                    const dx = particle.x - otherParticle.x
                    const dy = particle.y - otherParticle.y
                    const distance = Math.sqrt(dx * dx + dy * dy)

                    // Only draw lines if particles are close enough (within 200 pixels)
                    if (distance < 200) {
                        ctx.beginPath()
                        ctx.moveTo(particle.x, particle.y)
                        ctx.lineTo(otherParticle.x, otherParticle.y)
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - distance / 200)})`
                        ctx.lineWidth = 1.2
                        ctx.stroke()
                    }
                })

                // Draw particle
                ctx.beginPath()
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
                ctx.fillStyle = particle.color
                ctx.globalAlpha = particle.opacity
                ctx.fill()

                ctx.globalAlpha = 1
            })

            animationRef.current = requestAnimationFrame(animate)
        }

        const handleResize = () => {
            resizeCanvas()
            createParticles()
        }

        resizeCanvas()
        createParticles()
        animate()

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])
    return (
        <>
            <canvas ref={canvasRef} className="
                    absolute inset-0 w-full h-full 
                    z-[-1] pointer-events-none
                    bg-gradient-to-b from-gray-900 to-gray-800
                    dark:from-gray-800 dark:to-gray-900
                    transition-colors duration-500
                    blur-sm
                    opacity-50
                    md:blur-none
                    md:opacity-100
                    lg:blur-none lg:opacity-100
                    lg:fixed lg:inset-0 lg:z-[-1]
                    lg:w-full lg:h-full lg:object-cover
                    lg:object-center lg:object-cover
                    lg:transition-all lg:duration-500
                    lg:backdrop-blur-lg lg:backdrop-filter
                    lg:bg-gradient-to-b lg:from-gray-900 lg:to-gray-800
                    lg:dark:from-gray-800 lg:dark:to-gray-900
                    " />
        </>
    )
}