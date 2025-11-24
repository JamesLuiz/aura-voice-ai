import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface VoiceControlsProps {
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  disabled?: boolean;
}

const VoiceControls = ({
  isMuted,
  volume,
  onToggleMute,
  onVolumeChange,
  disabled = false,
}: VoiceControlsProps) => {
  return (
    <motion.div
      className="flex items-center gap-4 p-4 rounded-2xl bg-surface-elevated border border-border/50 backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Button
        onClick={onToggleMute}
        disabled={disabled}
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full hover:bg-primary/10"
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isMuted ? (
            <MicOff className="w-5 h-5 text-destructive" />
          ) : (
            <Mic className="w-5 h-5 text-primary" />
          )}
        </motion.div>
      </Button>

      <div className="flex items-center gap-2 flex-1">
        {volume === 0 ? (
          <VolumeX className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Volume2 className="w-5 h-5 text-muted-foreground" />
        )}
        <Slider
          value={[volume]}
          onValueChange={(values) => onVolumeChange(values[0])}
          max={1}
          step={0.01}
          disabled={disabled}
          className="w-32"
        />
        <span className="text-sm text-muted-foreground w-12">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </motion.div>
  );
};

export default VoiceControls;
