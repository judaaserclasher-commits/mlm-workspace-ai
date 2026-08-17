import confetti from 'canvas-confetti'

export function fireSaleCelebration() {
  confetti({
    particleCount: 140,
    spread: 75,
    origin: { y: 0.55 },
    colors: ['#2563EB', '#10B981', '#F59E0B', '#ffffff', '#93C5FD'],
    gravity: 0.9,
    scalar: 0.9,
  })
  // Second burst with slight delay for depth
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { x: 0.2, y: 0.5 },
      colors: ['#2563EB', '#10B981', '#ffffff'],
      gravity: 1,
    })
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { x: 0.8, y: 0.5 },
      colors: ['#2563EB', '#10B981', '#ffffff'],
      gravity: 1,
    })
  }, 180)
}
