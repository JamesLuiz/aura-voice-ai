import { motion } from "framer-motion";
import { RobotState, EmotionalState } from "./RobotAvatar";

interface CustomRobotFaceProps {
  eyePosition: { x: number; y: number };
  isBlinking: boolean;
  isSpeaking: boolean;
  audioLevel: number;
  emotionalState: EmotionalState;
  robotState: RobotState;
}

const CustomRobotFace = ({
  eyePosition,
  isBlinking,
  isSpeaking,
  audioLevel,
  emotionalState,
  robotState,
}: CustomRobotFaceProps) => {
  const lipSyncScale = isSpeaking ? 1 + audioLevel * 0.3 : 1;

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
        return "hsl(var(--primary))";
    }
  };

  return (
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

      {/* Eyes - Pupils */}
      {!isBlinking && (
        <>
          <motion.g
            animate={{
              x: eyePosition.x,
              y: eyePosition.y,
              scale: emotionalState === "surprised" ? 1.4 : 1,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <circle
              cx="70"
              cy="102.5"
              r={emotionalState === "surprised" ? "8" : "6"}
              fill={getStateColor()}
              style={{ filter: `drop-shadow(0 0 8px ${getStateColor()})` }}
            />
          </motion.g>
          
          <motion.g
            animate={{
              x: eyePosition.x,
              y: eyePosition.y,
              scale: emotionalState === "surprised" ? 1.4 : 1,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <circle
              cx="130"
              cy="102.5"
              r={emotionalState === "surprised" ? "8" : "6"}
              fill={getStateColor()}
              style={{ filter: `drop-shadow(0 0 8px ${getStateColor()})` }}
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

      {/* Eyebrows - Expressions */}
      {emotionalState === "thinking" && (
        <>
          <motion.line
            x1="55"
            y1="85"
            x2="85"
            y2="82"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
          <motion.line
            x1="145"
            y1="82"
            x2="115"
            y2="85"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
        </>
      )}

      {emotionalState === "confused" && (
        <>
          <motion.line
            x1="55"
            y1="82"
            x2="85"
            y2="87"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
          <motion.line
            x1="145"
            y1="87"
            x2="115"
            y2="83"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
        </>
      )}

      {emotionalState === "surprised" && (
        <>
          <motion.line
            x1="55"
            y1="80"
            x2="85"
            y2="80"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
            animate={{ y: [-2, 0, -2] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
          <motion.line
            x1="115"
            y1="80"
            x2="145"
            y2="80"
            stroke={getStateColor()}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
            animate={{ y: [-2, 0, -2] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          />
        </>
      )}

      {/* Mouth Area */}
      <g>
        {/* Mouth - Changes based on emotion and speech */}
        {emotionalState === "happy" && !isSpeaking && (
          <motion.path
            d="M 70 140 Q 100 155, 130 140"
            stroke={getStateColor()}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}

        {emotionalState === "confused" && !isSpeaking && (
          <motion.path
            d="M 70 145 Q 85 140, 100 145 Q 115 150, 130 145"
            stroke={getStateColor()}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {emotionalState === "surprised" && !isSpeaking && (
          <motion.ellipse
            cx="100"
            cy="145"
            rx="12"
            ry="16"
            stroke={getStateColor()}
            strokeWidth="3"
            fill="hsl(220 20% 8%)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        )}

        {/* Speaking Mouth - Lip Sync */}
        {isSpeaking && (
          <>
            <motion.ellipse
              cx="100"
              cy="145"
              rx="15"
              ry="10"
              fill="hsl(220 20% 8%)"
              stroke={getStateColor()}
              strokeWidth="2"
              animate={{
                ry: 10 * lipSyncScale,
                rx: 15 + audioLevel * 5,
              }}
              transition={{
                duration: 0.08,
                ease: "easeOut",
              }}
            />
            <motion.ellipse
              cx="100"
              cy="145"
              rx="10"
              ry="6"
              fill={getStateColor()}
              opacity="0.3"
              animate={{
                ry: 6 * lipSyncScale * 0.8,
                opacity: [0.2 + audioLevel * 0.3, 0.5 + audioLevel * 0.4, 0.2 + audioLevel * 0.3],
              }}
              transition={{
                ry: { duration: 0.08 },
                opacity: { duration: 0.12, repeat: Infinity },
              }}
            />
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
  );
};

export default CustomRobotFace;
