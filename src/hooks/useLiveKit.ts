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
      }
    });

    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      const isPlaying = room.canPlaybackAudio;
      setIsSpeaking(isPlaying);
      setRobotState(isPlaying ? "speaking" : "listening");
    });

    // Listen for text messages on the 'lk.chat' topic (LiveKit standard for chat)
    room.on(RoomEvent.TextReceived, (text: string, participant, info) => {
      // Only process messages from the 'lk.chat' topic
      if (info?.topic === 'lk.chat') {
        const newMessage: Message = {
          id: info.id || Date.now().toString(),
          role: participant.identity === room.localParticipant.identity ? "user" : "assistant",
          content: text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
        
        // Update emotional state based on content
        if (text.includes("?")) {
          setEmotionalState("confused");
        } else if (text.includes("!")) {
          setEmotionalState("surprised");
        }
      }
    });

    // Also listen for data messages for backward compatibility and other message types
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant, topic) => {
      // Handle non-text data messages (e.g., state updates)
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        
        if (data.type === "state") {
          setRobotState(data.state);
        } else if (data.type === "emotion") {
          setEmotionalState(data.emotion);
        }
      } catch (e) {
        // Ignore non-JSON data messages
      }
    });

    return () => {
      room.removeAllListeners();
      room.disconnect();
    };
  }, [room, volume]);

  // Simulate audio level and frequency for lip sync and visualization
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        // Simulate more natural speech patterns
        const random = Math.random();
        if (random > 0.7) {
          // High energy speech (vowels)
          setAudioLevel(Math.random() * 0.3 + 0.7);
          setFrequency(Math.random() * 2 + 1);
          setEmotionalState(random > 0.85 ? "happy" : "neutral");
        } else if (random > 0.3) {
          // Medium energy speech
          setAudioLevel(Math.random() * 0.3 + 0.4);
          setFrequency(Math.random() * 1.5 + 0.5);
        } else {
          // Low energy speech (consonants, pauses)
          setAudioLevel(Math.random() * 0.2);
          setFrequency(Math.random() * 0.5);
        }
      }, 80);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
      setFrequency(0);
      if (robotState === "thinking") {
        setEmotionalState("thinking");
      } else if (robotState === "idle") {
        setEmotionalState("neutral");
      }
    }
  }, [isSpeaking, robotState]);

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
      // Send text message using LiveKit's text stream API with 'lk.chat' topic
      // This is the standard way LiveKit handles chat messages (like in the playground)
      await room.localParticipant.sendText(text, {
        topic: 'lk.chat',
      });
    } catch (error) {
      console.error("Failed to send text message:", error);
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
