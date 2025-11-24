import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="relative flex items-center gap-2 p-2 rounded-2xl bg-surface-elevated border border-border/50 backdrop-blur-sm">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Connect to start chatting..." : "Type a message..."}
          disabled={disabled}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground h-12 text-base"
        />
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-10 w-10 rounded-xl bg-gradient-primary hover:opacity-90 disabled:opacity-50 shadow-lg"
        >
          <motion.div whileTap={{ scale: 0.9 }}>
            <Send className="w-5 h-5" />
          </motion.div>
        </Button>
      </div>
    </motion.form>
  );
};

export default ChatInput;
