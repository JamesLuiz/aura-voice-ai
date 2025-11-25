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

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio) {
        const audioElement = track.attach();
        audioElement.volume = volume;
        document.body.appendChild(audioElement);

        // Set up audio analysis for lip sync with real-time audio output
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyzer = ctx.createAnalyser();
        analyzer.fftSize = 512; // Higher resolution for better analysis
        analyzer.smoothingTimeConstant = 0.3; // Smoother transitions
        
        // Create a media element source from the audio element
        // This allows us to analyze the audio while it plays
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyzer);
        
        // Connect analyzer to destination to maintain audio playback
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

    // Listen for text messages on the 'lk.chat' topic (LiveKit standard for chat)
    room.on(RoomEvent.TextReceived, (text: string, participant, info) => {
      // Only process messages from the 'lk.chat' topic
      if (info?.topic === 'lk.chat') {
        const newMessage: Message = {
          id: info.id || Date.now().toString(),
          role: participant?.identity === room.localParticipant.identity ? "user" : "assistant",
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

    // Also listen for data messages for state/emotion updates
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
          }
        } catch {
          // Not JSON, ignore
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

  // Real-time audio analysis for lip sync - updates at 60fps for smooth animation
  useEffect(() => {
    if (isSpeaking && audioAnalyzer) {
      const bufferLength = audioAnalyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDataArray = new Uint8Array(bufferLength);
      
      let animationFrameId: number;
      
      const analyzeAudio = () => {
        if (!isSpeaking || !audioAnalyzer) {
          return;
        }
        
        // Get frequency data for amplitude analysis
        audioAnalyzer.getByteFrequencyData(dataArray);
        // Get time domain data for better real-time response
        audioAnalyzer.getByteTimeDomainData(timeDataArray);
        
        // Calculate RMS (Root Mean Square) from time domain for more accurate audio level
        let sumSquares = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
          const normalized = (timeDataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / timeDataArray.length);
        const normalizedLevel = Math.min(rms * 2, 1); // Scale and clamp to 0-1
        
        // Calculate average frequency amplitude for additional smoothing
        let freqSum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          freqSum += dataArray[i];
        }
        const freqAverage = freqSum / dataArray.length;
        const freqLevel = Math.min(freqAverage / 128, 1);
        
        // Combine both for more accurate audio level
        const combinedLevel = (normalizedLevel * 0.7 + freqLevel * 0.3);
        
        // Calculate dominant frequency for visualization
        let maxValue = 0;
        let maxIndex = 0;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > maxValue) {
            maxValue = dataArray[i];
            maxIndex = i;
          }
        }
        const normalizedFreq = maxIndex / bufferLength;
        
        // Update state with smooth values
        setAudioLevel(combinedLevel);
        setFrequency(normalizedFreq * 3); // Scale for visualization
        
        // Update emotional state based on audio characteristics
        if (combinedLevel > 0.7) {
          setEmotionalState("happy");
        } else if (combinedLevel > 0.4) {
          setEmotionalState("neutral");
        }
        
        // Continue animation loop
        animationFrameId = requestAnimationFrame(analyzeAudio);
      };
      
      // Start the analysis loop
      analyzeAudio();
      
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
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
      // Send text message using LiveKit's text stream API with 'lk.chat' topic
      // This is the standard way LiveKit handles chat messages (like in the playground)
      console.log("Sending text message:", text, "on topic: lk.chat");
      const result = await room.localParticipant.sendText(text, {
        topic: 'lk.chat',
      });
      console.log("Text message sent successfully:", result);
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
