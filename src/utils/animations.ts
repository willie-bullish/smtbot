// Premium Animation System
export const animations = {
  // Page transitions
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  },

  // Card animations
  cardEntry: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },

  // Hover effects
  cardHover: {
    scale: 1.05,
    y: -5,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },

  // Button animations
  buttonPress: {
    scale: 0.95,
    transition: { duration: 0.1 }
  },

  buttonHover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },

  // Stagger animations
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  }
};

// Haptic feedback simulation
export const haptic = {
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 5, 10]);
    }
  },
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 50]);
    }
  }
};

// Sound effects (using Web Audio API)
export const sounds = {
  context: null as AudioContext | null,
  
  init() {
    if (typeof window !== 'undefined' && !this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  },

  play(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
    
    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  },

  click() {
    this.play(800, 0.1, 'sine');
  },

  success() {
    this.play(523, 0.1, 'sine');
    setTimeout(() => this.play(659, 0.1, 'sine'), 100);
    setTimeout(() => this.play(784, 0.2, 'sine'), 200);
  },

  error() {
    this.play(300, 0.2, 'sawtooth');
  },

  achievement() {
    this.play(523, 0.1, 'sine');
    setTimeout(() => this.play(659, 0.1, 'sine'), 100);
    setTimeout(() => this.play(784, 0.1, 'sine'), 200);
    setTimeout(() => this.play(1047, 0.3, 'sine'), 300);
  }
};

// Particle effects
export const particles = {
  createParticle(x: number, y: number, emoji: string = '✨') {
    const particle = document.createElement('div');
    particle.textContent = emoji;
    particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      font-size: 20px;
      pointer-events: none;
      z-index: 9999;
      animation: particleFloat 1s ease-out forwards;
    `;
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 1000);
  },

  burst(x: number, y: number, count: number = 8, emojis: string[] = ['✨', '⭐', '💫']) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const offsetX = (Math.random() - 0.5) * 50;
        const offsetY = (Math.random() - 0.5) * 50;
        this.createParticle(x + offsetX, y + offsetY, emoji);
      }, i * 50);
    }
  }
};

// Add particle animation to global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes particleFloat {
      0% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translateY(-100px) scale(0.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Smooth scroll utility
export const smoothScroll = {
  to(element: HTMLElement, duration: number = 300) {
    const start = element.scrollTop;
    const target = element.scrollHeight - element.clientHeight;
    const distance = target - start;
    let startTime: number | null = null;

    function animateScroll(currentTime: number) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      element.scrollTop = start + distance * smoothScroll.easeOutCubic(progress);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    }

    requestAnimationFrame(animateScroll);
  },

  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
};

// Dark mode utilities
export const darkMode = {
  get(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  },

  set(enabled: boolean) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', enabled.toString());
      document.documentElement.classList.toggle('dark', enabled);
    }
  },

  toggle() {
    this.set(!this.get());
  }
};

// Loading states
export const loadingStates = {
  skeleton: (height: string = '1rem') => ({
    className: 'bg-gray-200 rounded animate-pulse',
    style: { height }
  }),

  spinner: (size: string = '1rem') => ({
    className: `animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600`,
    style: { width: size, height: size }
  })
};
