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

  // Natural blinking effect with variable duration
  useEffect(() => {
    if (!isConnected) return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      // Variable blink duration for more natural feel
      const blinkDuration = Math.random() * 50 + 100; // 100-150ms
      setTimeout(() => setIsBlinking(false), blinkDuration);
    }, Math.random() * 2000 + 2500); // Blink every 2.5-4.5 seconds

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

      // Limit eye movement range
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

  // Idle eye movement when not tracking cursor
  useEffect(() => {
    const idleInterval = setInterval(() => {
      const timeSinceLastMove = Date.now() - lastMouseMoveTime.current;
      
      if (timeSinceLastMove > 2000) {
        setIsTrackingCursor(false);
        // Natural looking around when idle
        setIdleEyePosition({
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 8,
        });
      }
    }, 3000);

    return () => clearInterval(idleInterval);
  }, []);

  // Touch interaction handler
  const handleTouch = () => {
    if (!isConnected) return;
    
    setIsTouched(true);
    onTouch?.();
    
    // Random playful head movement
    const randomRotations = [
      { rotateZ: 15, rotateY: 10, rotateX: -5 },
      { rotateZ: -15, rotateY: -10, rotateX: 5 },
      { rotateZ: 10, rotateY: -8, rotateX: 8 },
      { rotateZ: -12, rotateY: 12, rotateX: -8 },
    ];
    
    const randomReaction = randomRotations[Math.floor(Math.random() * randomRotations.length)];
    setTouchReaction(randomReaction);
    
    // Look at the point that was touched
    const randomEyeMovement = {
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 15,
    };
    setEyePosition(randomEyeMovement);
    
    // Reset after animation
    setTimeout(() => {
      setIsTouched(false);
      setTouchReaction({ rotateZ: 0, rotateY: 0, rotateX: 0 });
    }, 800);
  };

  const finalEyePosition = isTrackingCursor ? eyePosition : idleEyePosition;
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

  // Lip sync animation based on audio level
  const lipSyncScale = isSpeaking ? 1 + audioLevel * 0.1 : 1;

  // Enhanced head movements based on speech patterns, emotional state, and touch
  const getHeadRotation = () => {
    // Touch reaction takes priority
    if (isTouched) {
      return touchReaction;
    }
    
    if (isSpeaking) {
      // More pronounced dynamic head movement during speech
      const intensityMultiplier = audioLevel > 0.3 ? 1.5 : 1;
      return {
        rotateZ: Math.sin(frequency * 4) * audioLevel * 5 * intensityMultiplier,
        rotateY: Math.cos(frequency * 3) * audioLevel * 4 * intensityMultiplier,
        rotateX: Math.sin(frequency * 2) * audioLevel * 3 * intensityMultiplier,
      };
    }
    
    // More pronounced emotional expressions
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

      {/* Main robot container with head movements and touch interaction */}
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
        {/* Custom SVG Robot Face */}
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
          <CustomRobotFace
            eyePosition={finalEyePosition}
            isBlinking={isBlinking}
            isSpeaking={isSpeaking}
            audioLevel={audioLevel}
            emotionalState={emotionalState}
            robotState={robotState}
          />
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

export default RobotAvatar;
