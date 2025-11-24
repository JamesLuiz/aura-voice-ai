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
}

const RobotAvatar = ({ 
  isConnected, 
  isSpeaking, 
  robotState, 
  audioLevel = 0, 
  frequency = 0,
  emotionalState = "neutral"
}: RobotAvatarProps) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [idleEyePosition, setIdleEyePosition] = useState({ x: 0, y: 0 });
  const [isTrackingCursor, setIsTrackingCursor] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMouseMoveTime = useRef(Date.now());

  // Natural blinking effect
  useEffect(() => {
    if (!isConnected) return;

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000); // Blink every 2-5 seconds

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

  // Head tilt based on speech patterns and emotional state
  const getHeadRotation = () => {
    if (isSpeaking) {
      // Dynamic head movement during speech
      return {
        rotateZ: Math.sin(frequency * 3) * audioLevel * 3,
        rotateY: Math.cos(frequency * 2) * audioLevel * 2,
        rotateX: Math.sin(frequency) * audioLevel * 1.5,
      };
    }
    
    switch (emotionalState) {
      case "thinking":
        return { rotateZ: -5, rotateY: 3, rotateX: -2 };
      case "confused":
        return { rotateZ: 8, rotateY: -5, rotateX: 2 };
      case "surprised":
        return { rotateZ: 0, rotateY: 0, rotateX: -5 };
      case "happy":
        return { rotateZ: 3, rotateY: 2, rotateX: 1 };
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
      
      {/* Outer glow rings */}
      {isConnected && (
        <>
          <motion.div
            className="absolute w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border-2"
            style={{ borderColor: `${getStateColor().replace("50%)", "20%)")}` }}
            animate={{
              scale: isSpeaking ? [1, 1.15, 1] : [1, 1.08, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: isSpeaking ? 0.8 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-72 h-72 md:w-88 md:h-88 lg:w-[26rem] lg:h-[26rem] rounded-full border"
            style={{ borderColor: `${getStateColor().replace("50%)", "10%)")}` }}
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : [1, 1.12, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: isSpeaking ? 1 : 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
        </>
      )}

      {/* Main robot container with head movements */}
      <motion.div
        className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden flex items-center justify-center"
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
