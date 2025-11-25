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
  // Enhanced lip sync with MUCH more dynamic scaling for visibility
  const amplifiedAudioLevel = Math.min(audioLevel * 3, 1); // Amplify for visibility
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

      {/* Eyes - Pupils with enhanced expressions */}
      {!isBlinking && (
        <>
          <motion.g
            animate={{
              x: eyePosition.x,
              y: eyePosition.y,
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
              x: eyePosition.x,
              y: eyePosition.y,
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
  );
};

export default CustomRobotFace;
