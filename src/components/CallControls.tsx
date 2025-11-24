import { motion } from "framer-motion";
import { Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallControlsProps {
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const CallControls = ({ isConnected, onConnect, onDisconnect }: CallControlsProps) => {
  return (
    <div className="flex gap-4 justify-center">
      {!isConnected ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={onConnect}
            size="lg"
            className="relative h-16 px-8 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
          >
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Phone className="w-6 h-6" />
              <span>Connect to AI</span>
            </motion.div>
            
            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-lg border-2 border-primary"
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={onDisconnect}
            size="lg"
            variant="destructive"
            className="relative h-16 px-8 text-lg font-semibold shadow-lg"
          >
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneOff className="w-6 h-6" />
              <span>End Call</span>
            </motion.div>
            
            {/* Pulsing effect */}
            <motion.div
              className="absolute inset-0 rounded-lg bg-destructive/30"
              animate={{
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CallControls;
