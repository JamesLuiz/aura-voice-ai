import { motion } from "framer-motion";
import { Mic, MicOff, Loader2, MessageSquare } from "lucide-react";
import { RobotState } from "./RobotAvatar";

interface VoiceActivityIndicatorProps {
  robotState: RobotState;
  isListening: boolean;
  isMuted: boolean;
}

const VoiceActivityIndicator = ({
  robotState,
  isListening,
  isMuted,
}: VoiceActivityIndicatorProps) => {
  const getIndicatorContent = () => {
    if (isMuted) {
      return {
        icon: MicOff,
        text: "Microphone muted",
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      };
    }

    switch (robotState) {
      case "listening":
        return {
          icon: Mic,
          text: "Listening...",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        };
      case "thinking":
        return {
          icon: Loader2,
          text: "Thinking...",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
        };
      case "processing":
        return {
          icon: Loader2,
          text: "Processing...",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
        };
      case "speaking":
        return {
          icon: MessageSquare,
          text: "Speaking...",
          color: "text-cyan-500",
          bgColor: "bg-cyan-500/10",
        };
      case "error":
        return {
          icon: MicOff,
          text: "Error occurred",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
        };
      default:
        return {
          icon: Mic,
          text: "Ready",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
        };
    }
  };

  const indicator = getIndicatorContent();
  const Icon = indicator.icon;
  const isAnimating =
    robotState === "thinking" ||
    robotState === "processing" ||
    robotState === "listening";

  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-3 rounded-full ${indicator.bgColor} border border-border/50 backdrop-blur-sm`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative"
        animate={
          isAnimating
            ? {
                scale: [1, 1.1, 1],
              }
            : {}
        }
        transition={{
          duration: 1,
          repeat: isAnimating ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <Icon
          className={`h-5 w-5 ${indicator.color} ${
            robotState === "thinking" || robotState === "processing"
              ? "animate-spin"
              : ""
          }`}
        />
        
        {/* Pulse ring for listening state */}
        {robotState === "listening" && !isMuted && (
          <motion.div
            className="absolute inset-0 rounded-full bg-green-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}

        {/* Speaking pulse */}
        {robotState === "speaking" && (
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-500"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </motion.div>

      <div className="flex flex-col gap-0.5">
        <span className={`text-sm font-medium ${indicator.color}`}>
          {indicator.text}
        </span>
        {isListening && !isMuted && robotState === "listening" && (
          <motion.div
            className="flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-3 bg-green-500 rounded-full"
                animate={{
                  scaleY: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceActivityIndicator;
