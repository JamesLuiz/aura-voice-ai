import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ParticleField from "@/components/ParticleField";
import SoundWaveVisualization from "@/components/SoundWaveVisualization";
import CustomRobotFace from "@/components/CustomRobotFace";

export type RobotState = "idle" | "listening" | "thinking" | "speaking" | "processing" | "error";
export type EmotionalState = "neutral" | "happy" | "thinking" | "confused" | "surprised";

interface RobotAvatarProps {
  isConnected: boolean;
  isSpeaking: boolean;
  robotState: RobotState;
  audioLevel?: number;
  frequency?: number;
  emotionalState?: EmotionalState;
  onTouch?: () => void;
}

const RobotAvatar = ({ 
  isConnected, 
  isSpeaking, 
  robotState, 
  audioLevel = 0, 
  frequency = 0,
  emotionalState = "neutral",
  onTouch
}: RobotAvatarProps) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [idleEyePosition, setIdleEyePosition] = useState({ x: 0, y: 0 });
  const [isTrackingCursor, setIsTrackingCursor] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [touchReaction, setTouchReaction] = useState({ rotateZ: 0, rotateY: 0, rotateX: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseMoveTime = useRef(Date.now());

  // --- Blink & Eye Logic (Unchanged from your functional version) ---
  useEffect(() => {
    if (!isConnected) return;
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), Math.random() * 50 + 100);
    }, Math.random() * 2000 + 2500);
    return () => clearInterval(blinkInterval);
  }, [isConnected]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      lastMouseMoveTime.current = Date.now();
      setIsTrackingCursor(true);
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / 12; // Slightly stiffer for robot feel
      const deltaY = (e.clientY - centerY) / 12;
      setEyePosition({ x: Math.max(-12, Math.min(12, deltaX)), y: Math.max(-10, Math.min(10, deltaY)) });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const idleInterval = setInterval(() => {
      if (Date.now() - lastMouseMoveTime.current > 2000) {
        setIsTrackingCursor(false);
        setIdleEyePosition({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 6 });
      }
    }, 3000);
    return () => clearInterval(idleInterval);
  }, []);

  const handleTouch = () => {
    if (!isConnected) return;
    setIsTouched(true);
    onTouch?.();
    setTouchReaction({ rotateZ: (Math.random() - 0.5) * 20, rotateY: (Math.random() - 0.5) * 30, rotateX: 5 });
    setTimeout(() => { setIsTouched(false); setTouchReaction({ rotateZ: 0, rotateY: 0, rotateX: 0 }); }, 800);
  };

  const finalEyePosition = isTrackingCursor ? eyePosition : idleEyePosition;

  // --- VISUAL STYLING HELPERS ---
  const getPrimaryColor = () => {
    switch (robotState) {
      case "error": return "text-red-500 border-red-500 shadow-red-500/50";
      case "thinking": 
      case "processing": return "text-yellow-400 border-yellow-400 shadow-yellow-400/50";
      case "listening": return "text-emerald-400 border-emerald-400 shadow-emerald-400/50";
      case "speaking": return "text-cyan-400 border-cyan-400 shadow-cyan-400/50";
      default: return "text-blue-500 border-blue-500 shadow-blue-500/50";
    }
  };
  
  const getGlowColor = () => {
     switch (robotState) {
       case "error": return "rgba(239, 68, 68, 0.2)";
       case "listening": return "rgba(52, 211, 153, 0.15)";
       case "speaking": return "rgba(34, 211, 238, 0.2)";
       default: return "rgba(59, 130, 246, 0.15)";
     }
  }

  // Head Rotation Logic
  const getHeadRotation = () => {
    if (isTouched) return touchReaction;
    if (isSpeaking) {
      return {
        rotateZ: Math.sin(Date.now() / 400) * 2, // Slower, heavier movement
        rotateY: Math.sin(Date.now() / 300) * 5,
        rotateX: Math.sin(Date.now() / 250) * 2,
        y: Math.sin(Date.now() / 500) * 5 - 2,
      };
    }
    // Idle float
    return {
       rotateZ: 0, 
       rotateY: Math.sin(Date.now() / 2000) * 3, 
       rotateX: 0,
       y: Math.sin(Date.now() / 1500) * 4
    };
  };
  const headRotation = getHeadRotation();
  const themeClass = getPrimaryColor();

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full perspective-[1000px]">
      
      <SoundWaveVisualization audioLevel={audioLevel} frequency={frequency} isSpeaking={isSpeaking} robotState={robotState} />
      <ParticleField isSpeaking={isSpeaking} isProcessing={robotState === "processing"} robotState={robotState} isConnected={isConnected} />

      {/* --- ORBITAL RINGS CONTAINER --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
         {/* Inner Fast Ring */}
         {isConnected && (
            <motion.div 
               className={`absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-dashed opacity-30 ${themeClass.split(' ')[1]}`}
               animate={{ rotate: 360, scale: isSpeaking ? [1, 1.05, 1] : 1 }}
               transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
            />
         )}
         
         {/* Outer Slow Ring */}
         {isConnected && (
            <motion.div 
               className={`absolute w-72 h-72 md:w-96 md:h-96 rounded-full border border-dotted opacity-20 ${themeClass.split(' ')[1]}`}
               animate={{ rotate: -360 }}
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
         )}

         {/* Scanning Effect (when processing/thinking) */}
         {(robotState === 'thinking' || robotState === 'processing') && (
            <motion.div 
               className={`absolute w-64 h-64 md:w-80 md:h-80 rounded-full border-t-2 border-b-2 opacity-60 ${themeClass.split(' ')[1]}`}
               animate={{ rotate: 360 }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
         )}
      </div>

      {/* --- MAIN ROBOT HEAD --- */}
      <motion.div
        className="relative w-48 h-48 md:w-64 md:h-64 rounded-3xl flex items-center justify-center cursor-pointer z-10"
        onClick={handleTouch}
        whileHover={isConnected ? { scale: 1.05 } : {}}
        style={{ 
            // Glassmorphism Backplate
            background: `radial-gradient(circle at 50% 30%, ${getGlowColor()}, transparent 70%)`,
            backdropFilter: "blur(2px)",
        }}
        animate={{
          rotateZ: headRotation.rotateZ,
          rotateY: headRotation.rotateY,
          rotateX: headRotation.rotateX,
          y: headRotation.y || 0,
        }}
        transition={{ type: "spring", stiffness: 60, damping: 15 }}
      >
        <div className="w-full h-full drop-shadow-2xl">
          <CustomRobotFace
            eyePosition={finalEyePosition}
            isBlinking={isBlinking}
            isSpeaking={isSpeaking}
            audioLevel={audioLevel}
            emotionalState={emotionalState}
            robotState={robotState}
          />
        </div>
      </motion.div>

      {/* Connection Status Pill (Redesigned) */}
      <motion.div 
        className="absolute bottom-8 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
         <motion.div 
           className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-500"}`}
           animate={{ opacity: [0.5, 1, 0.5] }}
           transition={{ duration: 2, repeat: Infinity }}
         />
         <span className="text-xs text-white/70 font-mono tracking-wider uppercase">
            {isConnected ? "System Online" : "Offline"}
         </span>
      </motion.div>

    </div>
  );
};

export default RobotAvatar;