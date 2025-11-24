import { useState } from "react";
import { motion } from "framer-motion";
import RobotAvatar from "@/components/RobotAvatar";
import CallControls from "@/components/CallControls";
import ChatInput from "@/components/ChatInput";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    // TODO: Integrate with LiveKit here
    setIsConnected(true);
    toast({
      title: "Connected",
      description: "You're now connected to the AI assistant",
    });
    
    // Simulate speaking animation
    setTimeout(() => {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    }, 1000);
  };

  const handleDisconnect = () => {
    // TODO: Disconnect from LiveKit here
    setIsConnected(false);
    setIsSpeaking(false);
    toast({
      title: "Disconnected",
      description: "Call ended successfully",
      variant: "destructive",
    });
  };

  const handleSendMessage = (message: string) => {
    // TODO: Send message through LiveKit
    console.log("Sending message:", message);
    toast({
      title: "Message sent",
      description: message,
    });
    
    // Simulate AI response
    setTimeout(() => {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 2000);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
      
      {/* Glow effects */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full px-4 py-6 md:py-8">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <motion.h1
              className="text-2xl md:text-3xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              AI ASSISTANT
            </motion.h1>
            <ConnectionStatus isConnected={isConnected} isSpeaking={isSpeaking} />
          </div>
        </header>

        {/* Main area */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8 md:gap-12">
          {/* Robot avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RobotAvatar isConnected={isConnected} isSpeaking={isSpeaking} />
          </motion.div>

          {/* Status text */}
          <motion.div
            className="text-center space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              {isConnected
                ? isSpeaking
                  ? "I'm speaking..."
                  : "I'm listening"
                : "Ready to connect"}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {isConnected
                ? "Ask me anything, schedule meetings, or send emails"
                : "Connect to start a real-time conversation with your AI assistant"}
            </p>
          </motion.div>

          {/* Call controls */}
          <CallControls
            isConnected={isConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </main>

        {/* Chat input footer */}
        <footer className="w-full px-4 py-6 md:py-8">
          <ChatInput onSendMessage={handleSendMessage} disabled={!isConnected} />
        </footer>
      </div>
    </div>
  );
};

export default Index;
