import { motion } from "framer-motion";
import { Wifi, WifiOff, Mic, MicOff } from "lucide-react";

interface ConnectionStatusProps {
  isConnected: boolean;
  isSpeaking: boolean;
}

const ConnectionStatus = ({ isConnected, isSpeaking }: ConnectionStatusProps) => {
  return (
    <motion.div
      className="flex items-center gap-6 px-6 py-3 rounded-full bg-surface-elevated border border-border/50 backdrop-blur-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Connection status */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Wifi className="w-5 h-5 text-primary" />
          </motion.div>
        ) : (
          <WifiOff className="w-5 h-5 text-muted-foreground" />
        )}
        <span className={`text-sm font-medium ${isConnected ? "text-primary" : "text-muted-foreground"}`}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Speaking status */}
      <div className="flex items-center gap-2">
        {isSpeaking ? (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
            }}
          >
            <Mic className="w-5 h-5 text-accent" />
          </motion.div>
        ) : (
          <MicOff className="w-5 h-5 text-muted-foreground" />
        )}
        <span className={`text-sm font-medium ${isSpeaking ? "text-accent" : "text-muted-foreground"}`}>
          {isSpeaking ? "Speaking" : "Listening"}
        </span>
      </div>

      {/* Visual indicator bars */}
      {isSpeaking && (
        <div className="flex items-center gap-1 ml-2">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-accent rounded-full"
              animate={{
                height: ["8px", "20px", "8px"],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ConnectionStatus;
