import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ParticleField from "@/components/ParticleField";
import SoundWaveVisualization from "@/components/SoundWaveVisualization";

export type RobotState = "idle" | "listening" | "thinking" | "speaking" | "processing" | "error";
export type EmotionalState = "neutral" | "happy" | "thinking" | "confused" | "surprised";

interface CustomRobotFaceProps {
  isConnected: boolean;
  isSpeaking: boolean;
  robotState: RobotState;
  audioLevel?: number;
  frequency?: number;
  emotionalState?: EmotionalState;
  onTouch?: () => void;
}

const CustomRobotFace = ({ 
  isConnected, 
  isSpeaking, 
  robotState, 
  audioLevel = 0, 
  frequency = 0,
  emotionalState = "neutral",
  onTouch
}: CustomRobotFaceProps) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [idleEyePosition, setIdleEyePosition] = useState({ x: 0, y: 0 });
  const [isTrackingCursor, setIsTrackingCursor] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [touchReaction, setTouchReaction] = useState({ rotateZ: 0, rotateY: 0, rotateX: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseMoveTime = useRef(Date.now());

  // Natural blinking effect
  useEffect(() => {
    if (!isConnected) return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      const blinkDuration = Math.random() * 50 + 100;
      setTimeout(() => setIsBlinking(false), blinkDuration);
    }, Math.random() * 2000 + 2500);

    return () => clearInterval(blinkInterval);
  }, [isConnected]);

  // Eye tracking - follows cursor
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      lastMouseMoveTime.current = Date.now();
      setIsTrackingCursor(true);

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const maxRange = 15;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const limitedDistance = Math.min(distance, 200);
      
      const normalizedX = (deltaX / distance) * (limitedDistance / 200) * maxRange;
      const normalizedY = (deltaY / distance) * (limitedDistance / 200) * maxRange;

      setEyePosition({
        x: normalizedX || 0,
        y: normalizedY || 0,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Idle eye movement
  useEffect(() => {
    const idleInterval = setInterval(() => {
      const timeSinceLastMove = Date.now() - lastMouseMoveTime.current;
      
      if (timeSinceLastMove > 2000) {
        setIsTrackingCursor(false);
        setIdleEyePosition({
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 8,
        });
      }
    }, 3000);

    return () => clearInterval(idleInterval);
  }, []);

  // Touch interaction
  const handleTouch = () => {
    if (!isConnected) return;
    
    setIsTouched(true);
    onTouch?.();
    
    const randomRotations = [
      { rotateZ: 15, rotateY: 10, rotateX: -5 },
      { rotateZ: -15, rotateY: -10, rotateX: 5 },
      { rotateZ: 10, rotateY: -8, rotateX: 8 },
      { rotateZ: -12, rotateY: 12, rotateX: -8 },
    ];
    
    const randomReaction = randomRotations[Math.floor(Math.random() * randomRotations.length)];
    setTouchReaction(randomReaction);
    
    const randomEyeMovement = {
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 15,
    };
    setEyePosition(randomEyeMovement);
    
    setTimeout(() => {
      setIsTouched(false);
      setTouchReaction({ rotateZ: 0, rotateY: 0, rotateX: 0 });
    }, 800);
  };

  const finalEyePosition = isTrackingCursor ? eyePosition : idleEyePosition;
  
  // Enhanced lip sync with MUCH more dynamic scaling for visibility
  const amplifiedAudioLevel = Math.min(audioLevel * 3, 1);
  const lipSyncScale = isSpeaking ? 1 + amplifiedAudioLevel * 2 : 1;
  const jawOpenness = isSpeaking ? amplifiedAudioLevel * 2.5 : 0;

  const getStateColor = () => {
    switch (robotState) {
      case "error":
        return "hsl(0 100% 50%)";
      case "thinking":
      case "processing":
        return "hsl(45 100% 50%)";
      case "listening":
        return "hsl(150 100% 50%)";
      case "speaking":
        return "hsl(180 100% 50%)";
      default:
        return "hsl(220 13% 50%)";
    }
  };

  const getStateBorder = () => {
    const color = getStateColor();
    return isConnected
      ? `0 0 60px ${color.replace("50%)", "40%)")}, inset 0 0 40px ${color.replace("50%)", "10%)")}`
      : "0 10px 40px hsl(222 47% 4% / 0.6)";
  };

  // Head movements based on speech patterns, emotional state, and touch
  const getHeadRotation = () => {
    if (isTouched) {
      return touchReaction;
    }
    
    if (isSpeaking) {
      const intensityMultiplier = audioLevel > 0.3 ? 1.5 : 1;
      return {
        rotateZ: Math.sin(frequency * 4) * audioLevel * 5 * intensityMultiplier,
        rotateY: Math.cos(frequency * 3) * audioLevel * 4 * intensityMultiplier,
        rotateX: Math.sin(frequency * 2) * audioLevel * 3 * intensityMultiplier,
      };
    }
    
    switch (emotionalState) {
      case "thinking":
        return { rotateZ: -8, rotateY: 5, rotateX: -3 };
      case "confused":
        return { rotateZ: 12, rotateY: -8, rotateX: 3 };
      case "surprised":
        return { rotateZ: 0, rotateY: 0, rotateX: -8 };
      case "happy":
        return { rotateZ: 5, rotateY: 3, rotateX: 2 };
      default:
        return { rotateZ: 0, rotateY: 0, rotateX: 0 };
    }
  };

  const headRotation = getHeadRotation();

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full">
      {/* 3D Sound Wave Visualization */}
      <SoundWaveVisualization
        audioLevel={audioLevel}
        frequency={frequency}
        isSpeaking={isSpeaking}
        robotState={robotState}
      />
      
      {/* 3D Particle Field */}
      <ParticleField 
        isSpeaking={isSpeaking}
        isProcessing={robotState === "processing"}
        robotState={robotState}
        isConnected={isConnected}
      />

      {/* Main robot container */}
      <motion.div
        className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={handleTouch}
        whileHover={isConnected ? { scale: 1.02 } : {}}
        whileTap={isConnected ? { scale: 0.98 } : {}}
        style={{
          background: 'radial-gradient(circle at center, hsl(222 40% 12%), hsl(222 47% 8%))',
          boxShadow: getStateBorder(),
        }}
        animate={{
          scale: isSpeaking ? [1, 1.02, 1] : robotState === "thinking" ? [1, 1.01, 1] : 1,
          rotateZ: headRotation.rotateZ,
          rotateY: headRotation.rotateY,
          rotateX: headRotation.rotateX,
          y: isSpeaking ? [-2, 2, -2] : 0,
        }}
        transition={{
          scale: {
            duration: 0.8,
            repeat: isSpeaking || robotState === "thinking" ? Infinity : 0,
          },
          rotateZ: { duration: 0.5, ease: "easeOut" },
          rotateY: { duration: 0.5, ease: "easeOut" },
          rotateX: { duration: 0.5, ease: "easeOut" },
          y: {
            duration: 1.5,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut",
          },
        }}
      >
        {/* SVG Robot Face */}
        <motion.div
          className="w-full h-full"
          animate={{
            y: isConnected ? [0, -5, 0] : 0,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.3))" }}
    >
      {/* Robot Head - Main Body */}
      <defs>
        <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(220 20% 25%)", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(220 20% 15%)", stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: getStateColor(), stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: getStateColor(), stopOpacity: 0.3 }} />
        </linearGradient>
      </defs>

      {/* Head Container */}
      <rect
        x="30"
        y="40"
        width="140"
        height="140"
        rx="20"
        fill="url(#headGradient)"
        stroke={getStateColor()}
        strokeWidth="2"
      />

      {/* Top Antenna */}
      <motion.g
        animate={{
          y: isSpeaking ? [-1, 1, -1] : 0,
        }}
        transition={{
          duration: 0.5,
          repeat: isSpeaking ? Infinity : 0,
        }}
      >
        <line
          x1="100"
          y1="40"
          x2="100"
          y2="20"
          stroke={getStateColor()}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <motion.circle
          cx="100"
          cy="15"
          r="5"
          fill={getStateColor()}
          animate={{
            scale: isSpeaking ? [1, 1.3, 1] : 1,
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      </motion.g>

      {/* Accent Lines on Head */}
      <line x1="40" y1="60" x2="160" y2="60" stroke="url(#accentGradient)" strokeWidth="2" />
      <line x1="40" y1="70" x2="160" y2="70" stroke="url(#accentGradient)" strokeWidth="1" opacity="0.5" />

      {/* Side Vents */}
      <g opacity="0.7">
        <rect x="35" y="90" width="15" height="3" fill={getStateColor()} opacity="0.4" />
        <rect x="35" y="97" width="15" height="3" fill={getStateColor()} opacity="0.4" />
        <rect x="35" y="104" width="15" height="3" fill={getStateColor()} opacity="0.4" />
        
        <rect x="150" y="90" width="15" height="3" fill={getStateColor()} opacity="0.4" />
        <rect x="150" y="97" width="15" height="3" fill={getStateColor()} opacity="0.4" />
        <rect x="150" y="104" width="15" height="3" fill={getStateColor()} opacity="0.4" />
      </g>

      {/* Eye Sockets */}
      <rect x="55" y="90" width="30" height="25" rx="5" fill="hsl(220 20% 10%)" />
      <rect x="115" y="90" width="30" height="25" rx="5" fill="hsl(220 20% 10%)" />

      {/* Eyes - Pupils with enhanced expressions */}
      {!isBlinking && (
        <>
          <motion.g
            animate={{
              x: finalEyePosition.x,
              y: finalEyePosition.y,
              scale: emotionalState === "surprised" ? 1.5 : emotionalState === "happy" ? 1.1 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <circle
              cx="70"
              cy="102.5"
              r={emotionalState === "surprised" ? "9" : emotionalState === "thinking" ? "5" : "6"}
              fill={getStateColor()}
              style={{ filter: `drop-shadow(0 0 10px ${getStateColor()})` }}
            />
            {/* Eye shine for more life */}
            <circle
              cx="68"
              cy="100"
              r="2"
              fill="white"
              opacity="0.6"
            />
          </motion.g>
          
          <motion.g
            animate={{
              x: finalEyePosition.x,
              y: finalEyePosition.y,
              scale: emotionalState === "surprised" ? 1.5 : emotionalState === "happy" ? 1.1 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <circle
              cx="130"
              cy="102.5"
              r={emotionalState === "surprised" ? "9" : emotionalState === "thinking" ? "5" : "6"}
              fill={getStateColor()}
              style={{ filter: `drop-shadow(0 0 10px ${getStateColor()})` }}
            />
            {/* Eye shine for more life */}
            <circle
              cx="128"
              cy="100"
              r="2"
              fill="white"
              opacity="0.6"
            />
          </motion.g>
        </>
      )}

      {/* Eyelids - Blinking */}
      {isBlinking && (
        <>
          <motion.rect
            x="55"
            y="90"
            width="30"
            height="25"
            rx="5"
            fill="hsl(220 20% 20%)"
            initial={{ scaleY: 0, transformOrigin: "center" }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.1 }}
          />
          <motion.rect
            x="115"
            y="90"
            width="30"
            height="25"
            rx="5"
            fill="hsl(220 20% 20%)"
            initial={{ scaleY: 0, transformOrigin: "center" }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.1 }}
          />
        </>
      )}

      {/* Eyebrows - Enhanced Expressions */}
      {emotionalState === "thinking" && (
        <>
          <motion.line
            x1="52"
            y1="85"
            x2="85"
            y2="80"
            stroke={getStateColor()}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.9"
            animate={{ 
              y: [-0.5, 0.5, -0.5],
              x1: [52, 50, 52]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.line
            x1="148"
            y1="80"
            x2="115"
            y2="85"
            stroke={getStateColor()}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.9"
            animate={{ 
              y: [-0.5, 0.5, -0.5],
              x1: [148, 150, 148]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      )}

      {emotionalState === "confused" && (
        <>
          <motion.line
            x1="52"
            y1="80"
            x2="85"
            y2="88"
            stroke={getStateColor()}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.9"
            animate={{ 
              y1: [80, 82, 80],
              y2: [88, 90, 88]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.line
            x1="148"
            y1="88"
            x2="115"
            y2="81"
            stroke={getStateColor()}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.9"
            animate={{ 
              y1: [88, 90, 88],
              y2: [81, 83, 81]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </>
      )}

      {emotionalState === "surprised" && (
        <>
          <motion.line
            x1="52"
            y1="78"
            x2="85"
            y2="78"
            stroke={getStateColor()}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.9"
            animate={{ y: [-3, -1, -3] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          <motion.line
            x1="115"
            y1="78"
            x2="148"
            y2="78"
            stroke={getStateColor()}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.9"
            animate={{ y: [-3, -1, -3] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
        </>
      )}

      {emotionalState === "happy" && (
        <>
          <motion.path
            d="M 52 83 Q 68 78, 85 83"
            stroke={getStateColor()}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
          />
          <motion.path
            d="M 115 83 Q 132 78, 148 83"
            stroke={getStateColor()}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
          />
        </>
      )}

      {/* Mouth Area */}
      <g>
        {/* Mouth - Enhanced emotion-based expressions */}
        {emotionalState === "happy" && !isSpeaking && (
          <>
            <motion.path
              d="M 68 138 Q 100 158, 132 138"
              stroke={getStateColor()}
              strokeWidth="4.5"
              fill="none"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
            {/* Smile dimples */}
            <circle cx="68" cy="138" r="2" fill={getStateColor()} opacity="0.4" />
            <circle cx="132" cy="138" r="2" fill={getStateColor()} opacity="0.4" />
          </>
        )}

        {emotionalState === "confused" && !isSpeaking && (
          <motion.path
            d="M 68 145 Q 82 138, 100 146 Q 118 152, 132 144"
            stroke={getStateColor()}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: [
                "M 68 145 Q 82 138, 100 146 Q 118 152, 132 144",
                "M 68 145 Q 82 140, 100 145 Q 118 150, 132 144",
                "M 68 145 Q 82 138, 100 146 Q 118 152, 132 144"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {emotionalState === "surprised" && !isSpeaking && (
          <motion.ellipse
            cx="100"
            cy="148"
            rx="14"
            ry="18"
            stroke={getStateColor()}
            strokeWidth="3.5"
            fill="hsl(220 20% 8%)"
            initial={{ scale: 0 }}
            animate={{ 
              scale: [1, 1.05, 1],
              ry: [18, 20, 18]
            }}
            transition={{ 
              scale: { duration: 0.3 },
              ry: { duration: 0.5, repeat: Infinity }
            }}
          />
        )}

        {/* Speaking Mouth - DRAMATICALLY Enhanced Lip Sync */}
        {isSpeaking && (
          <>
            {/* Outer mouth with PRONOUNCED jaw movement */}
            <motion.ellipse
              cx="100"
              cy={145 + jawOpenness * 15}
              rx={20 + amplifiedAudioLevel * 25}
              ry={12 + amplifiedAudioLevel * 30}
              fill="hsl(220 20% 5%)"
              stroke={getStateColor()}
              strokeWidth="3"
              style={{
                filter: `drop-shadow(0 0 8px ${getStateColor()})`
              }}
              animate={{
                ry: 12 + amplifiedAudioLevel * 30,
                rx: 20 + amplifiedAudioLevel * 25,
                cy: 145 + jawOpenness * 15,
              }}
              transition={{
                duration: 0.05,
                ease: "linear",
              }}
            />
            {/* Inner glow tongue effect - more vibrant */}
            <motion.ellipse
              cx="100"
              cy={148 + jawOpenness * 12}
              rx={15 + amplifiedAudioLevel * 18}
              ry={8 + amplifiedAudioLevel * 20}
              fill={getStateColor()}
              opacity={0.4 + amplifiedAudioLevel * 0.6}
              animate={{
                ry: 8 + amplifiedAudioLevel * 20,
                rx: 15 + amplifiedAudioLevel * 18,
                cy: 148 + jawOpenness * 12,
              }}
              transition={{
                duration: 0.05,
                ease: "linear",
              }}
            />
            {/* Teeth line for realism - always visible when speaking */}
            {amplifiedAudioLevel > 0.15 && (
              <motion.line
                x1={100 - (12 + amplifiedAudioLevel * 15)}
                y1={145 + jawOpenness * 8}
                x2={100 + (12 + amplifiedAudioLevel * 15)}
                y2={145 + jawOpenness * 8}
                stroke="hsl(220 20% 85%)"
                strokeWidth="2"
                opacity={0.7 + amplifiedAudioLevel * 0.3}
                animate={{
                  x1: 100 - (12 + amplifiedAudioLevel * 15),
                  x2: 100 + (12 + amplifiedAudioLevel * 15),
                  y1: 145 + jawOpenness * 8,
                  y2: 145 + jawOpenness * 8,
                }}
                transition={{
                  duration: 0.05,
                  ease: "linear",
                }}
              />
            )}
          </>
        )}

        {/* Neutral Mouth */}
        {!isSpeaking && emotionalState === "neutral" && (
          <motion.line
            x1="80"
            y1="145"
            x2="120"
            y2="145"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        )}

        {emotionalState === "thinking" && !isSpeaking && (
          <motion.line
            x1="80"
            y1="145"
            x2="120"
            y2="148"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        )}
      </g>

      {/* Voice Indicator - Glowing effect when speaking */}
      {isSpeaking && (
        <motion.circle
          cx="100"
          cy="145"
          r="25"
          fill="none"
          stroke={getStateColor()}
          strokeWidth="2"
          opacity="0.3"
          animate={{
            r: [25, 30, 25],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
          }}
        />
      )}

      {/* Bottom Accent Line */}
      <line x1="40" y1="165" x2="160" y2="165" stroke="url(#accentGradient)" strokeWidth="2" />
    </svg>
        </motion.div>

        {/* State overlay effects */}
        {robotState === "thinking" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full"
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )}

        {robotState === "processing" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-yellow-500/30 via-transparent to-yellow-500/30 rounded-full"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}

        {robotState === "error" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-transparent rounded-full"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          />
        )}

        {isSpeaking && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
            }}
          />
        )}
      </motion.div>

      {/* Status indicator dot */}
      <motion.div
        className="absolute bottom-4 right-4 md:bottom-8 md:right-8"
        animate={{
          scale: isConnected ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      >
        <div className="relative">
          <div
            className={`w-4 h-4 rounded-full ${
              isConnected ? "bg-primary" : "bg-muted-foreground/50"
            }`}
            style={{
              boxShadow: isConnected ? "0 0 20px hsl(var(--primary))" : "none",
            }}
          />
          {isConnected && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.8, 0, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomRobotFace;
