import { motion } from "framer-motion";
import robotAvatar from "@/assets/robot-avatar.png";

interface RobotAvatarProps {
  isConnected: boolean;
  isSpeaking: boolean;
}

const RobotAvatar = ({ isConnected, isSpeaking }: RobotAvatarProps) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {isConnected && (
        <>
          <motion.div
            className="absolute w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full border-2 border-primary/20"
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
            className="absolute w-72 h-72 md:w-88 md:h-88 lg:w-[26rem] lg:h-[26rem] rounded-full border border-primary/10"
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
          boxShadow: isConnected 
            ? '0 0 60px hsl(180 100% 50% / 0.4), inset 0 0 40px hsl(180 100% 50% / 0.1)'
            : '0 10px 40px hsl(222 47% 4% / 0.6)',
        }}
        animate={{
          scale: isSpeaking ? [1, 1.02, 1] : 1,
        }}
        transition={{
          duration: 0.8,
          repeat: isSpeaking ? Infinity : 0,
        }}
      >
        {/* Robot image */}
        <motion.img
          src={robotAvatar}
          alt="AI Assistant Robot"
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

        {/* Overlay glow effect when speaking */}
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
