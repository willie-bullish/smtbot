import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '../utils/animations';
interface Slide {
  id: number;
  title: string;
  description: string;
  emoji: string;
  hologramColor: string;
}

const WelcomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const slides: Slide[] = [
    {
      id: 1,
      title: "",
      description: "WE WERE ALL TOLD\nIT WAS\nPROBABLY\nNOTHING\nAT THE \nBEGINNING...\n",
      emoji: "",
      hologramColor: "cyan"
    },
    {
      id: 2,
      title: "",
      description: "YET THE\nUNEXPECTED\nCAME FROM\nNOTHING",
      emoji: "",
      hologramColor: "magenta"
    },
    {
      id: 3,
      title: "",
      description: "IT WAS A\nPROOF\nTHAT\nSOMETHIN\nCAN COME FROM\nNOTHING",
      emoji: "",
      hologramColor: "purple"
    },
    {
      id: 4,
      title: "",
      description: "DO YOU\nBELIEVE IN\nSOMETHIN\n???",
      emoji: "",
      hologramColor: "orange"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isTransitioning) {
        handleNextSlide();
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length, isTransitioning]);

  
  const handleNextSlide = () => {
    setIsTransitioning(true);
    haptic.light();
    
    setTimeout(() => {
      setCurrentSlide((prev) => {
        if (prev === slides.length - 1) {
          return prev;
        }
        return prev + 1;
      });
      setIsTransitioning(false);
    }, 300);
  };

  const handleSkip = () => {
    haptic.heavy();
    navigate('/main');
  };

  const handleGetStarted = () => {
    haptic.success();
    setTimeout(() => {
      navigate('/main');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Pitch Black Background with White Lines */}
      <div className="absolute inset-0">
        {/* Slide 1: Moving white rectangles */}
        <div className={`absolute inset-0 transition-all duration-1000 ${
          currentSlide === 0 ? 'opacity-100' : 'opacity-0'
        }`}>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {[...Array(4)].map((_, i) => (
              <g key={i}>
                <rect
                  x={100 + i * 300}
                  y={100 + i * 200}
                  width={80}
                  height={80}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1"
                  className="animate-move-rect"
                  style={{
                    animationDelay: `${i * 0.8}s`
                  }}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Slide 2: Moving white triangles */}
        <div className={`absolute inset-0 transition-all duration-1000 ${
          currentSlide === 1 ? 'opacity-100' : 'opacity-0'
        }`}>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {[...Array(5)].map((_, i) => (
              <g key={i}>
                <polygon
                  points={`${150 + i * 250},${100 + i * 150} ${200 + i * 250},${180 + i * 150} ${100 + i * 250},${180 + i * 150}`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="1"
                  className="animate-move-triangle"
                  style={{
                    animationDelay: `${i * 0.6}s`
                  }}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Slide 3: Moving white circles */}
        <div className={`absolute inset-0 transition-all duration-1000 ${
          currentSlide === 2 ? 'opacity-100' : 'opacity-0'
        }`}>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {[...Array(6)].map((_, i) => (
              <g key={i}>
                <circle
                  cx={150 + i * 200}
                  cy={150 + i * 120}
                  r={40}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.6)"
                  strokeWidth="1"
                  className="animate-move-circle"
                  style={{
                    animationDelay: `${i * 0.5}s`
                  }}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Slide 4: Moving portal circles */}
        <div className={`absolute inset-0 transition-all duration-1000 ${
          currentSlide === 3 ? 'opacity-100' : 'opacity-0'
        }`}>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {[...Array(4)].map((_, i) => (
              <g key={i}>
                <circle
                  cx={200 + i * 300}
                  cy={200 + i * 150}
                  r={50}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="2"
                  className="animate-portal"
                  style={{
                    animationDelay: `${i * 0.4}s`
                  }}
                />
                <circle
                  cx={200 + i * 300}
                  cy={200 + i * 150}
                  r={30}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="1"
                  className="animate-portal-inner"
                  style={{
                    animationDelay: `${i * 0.4 + 0.2}s`
                  }}
                />
              </g>
            ))}
          </svg>
        </div>

              </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-none sm:max-w-md md:max-w-lg lg:max-w-xl">
          {/* Skip Button - Top Right */}
          <div className="fixed top-4 sm:top-6 right-4 sm:right-6 z-20 animate-fade-in">
            <button
              id="skip-button"
              onClick={handleSkip}
              className="group relative px-3 sm:px-4 py-2 sm:py-3 border border-white/30 text-white/70 font-medium text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 hover:border-white/60 hover:text-white hover:bg-white/10 hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] backdrop-blur-sm rounded-full"
            >
              <span className="flex items-center">
                Skip
                <span className="ml-1 sm:ml-2 transform transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

          {/* Typewriter Text Display */}
          <div className={`text-left mb-12 transition-all duration-500 transform min-h-[150px] sm:min-h-[200px] flex items-start justify-start ${
            isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}>
            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-relaxed w-[90vw] sm:w-[80vw] md:w-[600px] lg:w-[700px] min-h-[80px] sm:min-h-[100px] whitespace-pre-line animate-slide-up tracking-wide px-4">
              {slides[currentSlide]?.description.split('\n').map((line, index) => (
                <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.5}s`, animationFillMode: 'both' }}>
                  {line === 'NOTHING' || line === 'PROBABLY' || line === 'UNEXPECTED' || line === 'PROOF' || line === 'SOMETHIN' ? (
                    <span className="font-black text-transparent text-5xl sm:text-6xl md:text-7xl lg:text-8xl" style={{ WebkitTextStroke: '2px white', textStroke: '2px white' } as React.CSSProperties}>
                      {line}
                    </span>
                  ) : (
                    <span>{line}</span>
                  )}
                  {index < slides[currentSlide]?.description.split('\n').length - 1 && <br />}
                </div>
              ))}
            </div>
          </div>

          
          {/* Holographic Action Button */}
          {currentSlide === slides.length - 1 ? (
            <button
              id="action-button"
              onClick={handleGetStarted}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 border-2 border-cyan-500 text-cyan-400 font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] bg-cyan-500/10 animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="flex items-center justify-center">
                ENTER
                <span className="ml-2 text-lg sm:text-xl">🌌</span>
              </span>
            </button>
          ) : null}


        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes move-rect {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg); 
            opacity: 0.4;
          }
          25% { 
            transform: translate(50px, -30px) rotate(90deg); 
            opacity: 0.6;
          }
          50% { 
            transform: translate(-30px, 50px) rotate(180deg); 
            opacity: 0.3;
          }
          75% { 
            transform: translate(-50px, -20px) rotate(270deg); 
            opacity: 0.5;
          }
        }
        
        @keyframes move-triangle {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.5;
          }
          33% { 
            transform: translate(40px, -40px) scale(1.2); 
            opacity: 0.7;
          }
          66% { 
            transform: translate(-40px, 30px) scale(0.8); 
            opacity: 0.4;
          }
        }
        
        @keyframes move-circle {
          0%, 100% { 
            transform: translate(0, 0); 
            opacity: 0.6;
          }
          25% { 
            transform: translate(60px, -20px); 
            opacity: 0.8;
          }
          50% { 
            transform: translate(-30px, 40px); 
            opacity: 0.5;
          }
          75% { 
            transform: translate(-40px, -30px); 
            opacity: 0.7;
          }
        }
        
        @keyframes portal {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.7;
          }
          50% { 
            transform: scale(1.3) rotate(180deg); 
            opacity: 0.3;
          }
        }
        
        @keyframes portal-inner {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.5;
          }
          50% { 
            transform: scale(0.7) rotate(-180deg); 
            opacity: 0.8;
          }
        }
        
                
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
          animation-fill-mode: both;
        }
        
        .animate-move-rect {
          animation: move-rect 8s ease-in-out infinite;
        }
        
        .animate-move-triangle {
          animation: move-triangle 6s ease-in-out infinite;
        }
        
        .animate-move-circle {
          animation: move-circle 7s ease-in-out infinite;
        }
        
        .animate-portal {
          animation: portal 4s ease-in-out infinite;
        }
        
        .animate-portal-inner {
          animation: portal-inner 4s ease-in-out infinite;
        }
        
              `}} />
    </div>
  );
};

export default WelcomePage;