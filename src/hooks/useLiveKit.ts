import { useState, useEffect, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  LocalParticipant,
  RemoteParticipant,
} from "livekit-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type RobotState = "idle" | "listening" | "thinking" | "speaking" | "processing" | "error";
export type EmotionalState = "neutral" | "happy" | "thinking" | "confused" | "surprised";

export const useLiveKit = () => {
  const [room] = useState(() => new Room());
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [robotState, setRobotState] = useState<RobotState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>("neutral");
  const [audioAnalyzer, setAudioAnalyzer] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    room.on(RoomEvent.Connected, () => {
      setIsConnected(true);
      setRobotState("listening");
    });

    room.on(RoomEvent.Disconnected, () => {
      setIsConnected(false);
      setIsSpeaking(false);
      setRobotState("idle");
    });

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.volume = volume;
        document.body.appendChild(audioElement);

        // Set up audio analysis for lip sync
        const ctx = new AudioContext();
        const analyzer = ctx.createAnalyser();
        analyzer.fftSize = 256;
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyzer);
        analyzer.connect(ctx.destination);
        
        setAudioContext(ctx);
        setAudioAnalyzer(analyzer);
      }
    });

    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      const isPlaying = room.canPlaybackAudio;
      setIsSpeaking(isPlaying);
      setRobotState(isPlaying ? "speaking" : "listening");
    });

    // Listen for data messages for state updates and text messages
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant, topic) => {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        
        // Try to parse as JSON for state/emotion updates
        try {
          const data = JSON.parse(text);
          if (data.type === "state") {
            setRobotState(data.state);
          } else if (data.type === "emotion") {
            setEmotionalState(data.emotion);
          } else if (data.type === "message") {
            // Handle text messages
            const newMessage: Message = {
              id: Date.now().toString(),
              role: participant?.identity === room.localParticipant.identity ? "user" : "assistant",
              content: data.content || text,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        } catch {
          // Not JSON, treat as plain text message
          const newMessage: Message = {
            id: Date.now().toString(),
            role: participant?.identity === room.localParticipant.identity ? "user" : "assistant",
            content: text,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      } catch (e) {
        console.error("Error processing data:", e);
      }
    });

    return () => {
      room.removeAllListeners();
      room.disconnect();
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [room, volume]);

  // Real-time audio analysis for lip sync
  useEffect(() => {
    if (isSpeaking && audioAnalyzer) {
      const bufferLength = audioAnalyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const analyzeAudio = () => {
        if (!isSpeaking) return;
        
        audioAnalyzer.getByteFrequencyData(dataArray);
        
        // Calculate average amplitude for mouth opening
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
        
        // Calculate dominant frequency for visualization
        let maxValue = 0;
        let maxIndex = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxValue) {
            maxValue = dataArray[i];
            maxIndex = i;
          }
        }
        const normalizedFreq = maxIndex / bufferLength;
        
        setAudioLevel(normalizedLevel);
        setFrequency(normalizedFreq * 3); // Scale for visualization
        
        // Update emotional state based on audio characteristics
        if (normalizedLevel > 0.7) {
          setEmotionalState("happy");
        } else if (normalizedLevel > 0.4) {
          setEmotionalState("neutral");
        }
        
        requestAnimationFrame(analyzeAudio);
      };
      
      analyzeAudio();
    } else if (!isSpeaking) {
      setAudioLevel(0);
      setFrequency(0);
      if (robotState === "thinking") {
        setEmotionalState("thinking");
      } else if (robotState === "idle") {
        setEmotionalState("neutral");
      }
    }
  }, [isSpeaking, audioAnalyzer, robotState]);

  const connect = useCallback(async (url?: string, token?: string) => {
    try {
      setRobotState("processing");
      
      // If URL and token are not provided, fetch from backend
      if (!url || !token) {
        // First get the LiveKit URL
        const urlResponse = await fetch("http://localhost:5001/getLiveKitUrl");
        if (!urlResponse.ok) {
          throw new Error(`Failed to get LiveKit URL: ${urlResponse.statusText}`);
        }
        const urlData = await urlResponse.json();
        if (!urlData.url || urlData.url === "wss://your-livekit-server.com") {
          throw new Error("LiveKit URL not configured. Please set LIVEKIT_URL in your .env file.");
        }
        url = urlData.url;
        
        // Then get the token
        const tokenResponse = await fetch("http://localhost:5001/getToken?name=user");
        if (!tokenResponse.ok) {
          throw new Error(`Failed to get token: ${tokenResponse.statusText}`);
        }
        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
          throw new Error(tokenData.error);
        }
        token = tokenData.token;
      }
      
      if (!url || !token) {
        throw new Error("Missing LiveKit URL or token");
      }
      
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsListening(true);
    } catch (error) {
      console.error("Failed to connect:", error);
      setRobotState("error");
      throw error;
    }
  }, [room]);

  const disconnect = useCallback(() => {
    room.disconnect();
    setMessages([]);
  }, [room]);

  const toggleMute = useCallback(async () => {
    const newMutedState = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!newMutedState);
    setIsMuted(newMutedState);
    setIsListening(!newMutedState);
  }, [room, isMuted]);

  const changeVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    // Update all audio elements
    room.remoteParticipants.forEach((participant) => {
      participant.audioTrackPublications.forEach((publication) => {
        if (publication.track) {
          const audioElement = publication.track.attachedElements[0] as HTMLAudioElement;
          if (audioElement) {
            audioElement.volume = newVolume;
          }
        }
      });
    });
  }, [room]);

  const sendMessage = useCallback(async (text: string) => {
    if (!isConnected || !text.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    
    // Add message to local state immediately for better UX
    setMessages((prev) => [...prev, message]);

    try {
      // Send as data message
      const encoder = new TextEncoder();
      const data = JSON.stringify({
        type: "message",
        content: text,
      });
      await room.localParticipant.publishData(encoder.encode(data), {
        reliable: true,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove the message from state if sending failed
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    }
  }, [room, isConnected]);

  return {
    connect,
    disconnect,
    toggleMute,
    changeVolume,
    sendMessage,
    isConnected,
    isSpeaking,
    isListening,
    isMuted,
    volume,
    messages,
    robotState,
    audioLevel,
    frequency,
    emotionalState,
  };
};
