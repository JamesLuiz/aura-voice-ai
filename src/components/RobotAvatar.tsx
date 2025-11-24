import { motion } from "framer-motion";
import robotAvatar from "@/assets/robot-avatar.png";
import ParticleField from "@/components/ParticleField";

export type RobotState = "idle" | "listening" | "thinking" | "speaking" | "processing" | "error";

interface RobotAvatarProps {
  isConnected: boolean;
  isSpeaking: boolean;
  robotState: RobotState;
  audioLevel?: number;
}

const RobotAvatar = ({ isConnected, isSpeaking, robotState, audioLevel = 0 }: RobotAvatarProps) => {
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

  return (
    <div className="relative flex items-center justify-center w-full h-full">
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

      {/* Main robot container */}
      <motion.div
        className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full overflow-hidden"
        style={{
          background: 'radial-gradient(circle at center, hsl(222 40% 12%), hsl(222 47% 8%))',
          boxShadow: getStateBorder(),
        }}
        animate={{
          scale: isSpeaking ? [1, 1.02, 1] : robotState === "thinking" ? [1, 1.01, 1] : 1,
          rotate: robotState === "processing" ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          scale: {
            duration: 0.8,
            repeat: isSpeaking || robotState === "thinking" ? Infinity : 0,
          },
          rotate: {
            duration: 2,
            repeat: robotState === "processing" ? Infinity : 0,
          },
        }}
      >
        {/* Robot image */}
        <motion.img
          src={robotAvatar}
          alt="Voxa AI Assistant Robot"
          className="w-full h-full object-cover"
          animate={{
            y: isConnected ? [0, -5, 0] : 0,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Lip sync mouth overlay */}
        {isSpeaking && (
          <motion.div
            className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-16 h-8 rounded-full bg-primary/60 blur-md"
            animate={{
              scaleY: lipSyncScale,
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              scaleY: { duration: 0.1 },
              opacity: { duration: 0.15, repeat: Infinity },
            }}
          />
        )}

        {/* State overlay effects */}
        {robotState === "thinking" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent"
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
            className="absolute inset-0 bg-gradient-to-tr from-yellow-500/30 via-transparent to-yellow-500/30"
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
            className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-transparent"
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
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"
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
