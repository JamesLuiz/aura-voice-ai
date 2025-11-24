import { motion } from "framer-motion";
import RobotAvatar from "@/components/RobotAvatar";
import CallControls from "@/components/CallControls";
import ChatInput from "@/components/ChatInput";
import VoiceControls from "@/components/VoiceControls";
import ConversationHistory from "@/components/ConversationHistory";
import { useLiveKit } from "@/hooks/useLiveKit";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const {
    connect,
    disconnect,
    toggleMute,
    changeVolume,
    sendMessage,
    isConnected,
    isSpeaking,
    isMuted,
    volume,
    messages,
    robotState,
    audioLevel,
    frequency,
    emotionalState,
  } = useLiveKit();

  const handleConnect = async () => {
    try {
      // TODO: Replace with your actual LiveKit URL and token
      const url = "wss://your-livekit-server.com";
      const token = "your-token-here";
      
      await connect(url, token);
      
      toast({
        title: "Connected",
        description: "You're now connected to Voxa",
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect to Voxa. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Disconnected",
      description: "Call ended successfully",
      variant: "destructive",
    });
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message);
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
          <div className="max-w-7xl mx-auto text-center">
            <motion.h1
              className="text-2xl md:text-4xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              VOXA
            </motion.h1>
            <motion.p
              className="text-xs md:text-sm text-muted-foreground font-medium tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your AI Assistant
            </motion.p>
          </div>
        </header>

        {/* Main area */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 md:py-8 gap-6 md:gap-8 w-full">
          {/* Robot avatar with particle effects */}
          <motion.div
            className="relative w-full max-w-lg aspect-square"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RobotAvatar 
              isConnected={isConnected} 
              isSpeaking={isSpeaking}
              robotState={robotState}
              audioLevel={audioLevel}
              frequency={frequency}
              emotionalState={emotionalState}
            />
          </motion.div>

          {/* Status text */}
          <motion.div
            className="text-center space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg md:text-2xl font-semibold text-foreground">
              {robotState === "idle" && "Ready to connect"}
              {robotState === "listening" && "I'm listening..."}
              {robotState === "thinking" && "Thinking..."}
              {robotState === "speaking" && "Speaking..."}
              {robotState === "processing" && "Processing..."}
              {robotState === "error" && "Error occurred"}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-md px-4">
              {isConnected
                ? "Ask me anything, schedule meetings, or send emails"
                : "Connect to start a real-time conversation with Voxa"}
            </p>
          </motion.div>

          {/* Call controls */}
          <CallControls
            isConnected={isConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />

          {/* Voice controls */}
          {isConnected && (
            <VoiceControls
              isMuted={isMuted}
              volume={volume}
              onToggleMute={toggleMute}
              onVolumeChange={changeVolume}
            />
          )}

          {/* Conversation history */}
          {isConnected && <ConversationHistory messages={messages} />}
        </main>

        {/* Chat input footer - Always visible when connected */}
        <footer className="w-full px-4 py-4 md:py-6">
          <ChatInput onSendMessage={handleSendMessage} disabled={!isConnected} />
        </footer>
      </div>
    </div>
  );
};

export default Index;
