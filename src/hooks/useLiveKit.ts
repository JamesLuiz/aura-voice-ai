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
  const LOCAL_BACKEND = "http://localhost:5001";
  const RENDER_BACKEND = "https://aura-voice-ai-2.onrender.com";

  const fetchWithTimeout = useCallback(
    async (url: string, options?: RequestInit, timeout = 4000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
      } finally {
        clearTimeout(timer);
      }
    },
    []
  );

  const fetchFromBackend = useCallback(
    async (path: string, options?: RequestInit) => {
      const endpoints = [
        `${LOCAL_BACKEND}${path}`,
        `${RENDER_BACKEND}${path}`,
      ];

      for (const url of endpoints) {
        try {
          const response =
            url.startsWith(LOCAL_BACKEND) ?
              await fetchWithTimeout(url, options) :
              await fetch(url, options);

          if (response.ok) {
            return response;
          }
          console.warn(`Backend request to ${url} failed with status ${response.status}`);
        } catch (error) {
          console.warn(`Backend request to ${url} failed:`, error);
        }
      }

      throw new Error("Unable to reach backend server. Please ensure it is running locally or deployed.");
    },
    [LOCAL_BACKEND, RENDER_BACKEND, fetchWithTimeout]
  );
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
      // Only analyze remote participant audio (the agent's audio), not local participant
      if (
        track.kind === Track.Kind.Audio &&
        participant &&
        participant.identity !== room.localParticipant.identity
      ) {
        console.log("Setting up audio analysis for agent:", participant.identity);
        
        const audioElement = track.attach();
        audioElement.volume = volume;
        document.body.appendChild(audioElement);
        
        // Wait for audio element to be ready
        audioElement.addEventListener('canplay', () => {
          console.log("Audio element ready, setting up analyzer");
          
          // Set up audio analysis for lip sync with real-time audio output
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Resume audio context if suspended (browser autoplay policy)
          if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
              console.log("Audio context resumed");
            });
          }
          
          const analyzer = ctx.createAnalyser();
          analyzer.fftSize = 256; // Lower for faster updates
          analyzer.smoothingTimeConstant = 0.1; // Very responsive
          analyzer.minDecibels = -90;
          analyzer.maxDecibels = -10;
          
          // Create a media element source from the audio element
          // This allows us to analyze the audio while it plays
          const source = ctx.createMediaElementSource(audioElement);
          source.connect(analyzer);
          
          // Connect analyzer to destination to maintain audio playback
          analyzer.connect(ctx.destination);
          
          setAudioContext(ctx);
          setAudioAnalyzer(analyzer);
          
          console.log("Audio analyzer set up successfully");
        }, { once: true });
        
        // Also set up immediately in case canplay already fired
        if (audioElement.readyState >= 2) {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          const analyzer = ctx.createAnalyser();
          analyzer.fftSize = 256;
          analyzer.smoothingTimeConstant = 0.1;
          analyzer.minDecibels = -90;
          analyzer.maxDecibels = -10;
          const source = ctx.createMediaElementSource(audioElement);
          source.connect(analyzer);
          analyzer.connect(ctx.destination);
          setAudioContext(ctx);
          setAudioAnalyzer(analyzer);
          console.log("Audio analyzer set up immediately");
        }
      }
    });

    // Listen for when remote participants start/stop speaking
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (
        track.kind === Track.Kind.Audio &&
        participant &&
        participant.identity !== room.localParticipant.identity
      ) {
        // Monitor when the agent's audio track becomes active
        track.on("muted", () => {
          setIsSpeaking(false);
          setRobotState("listening");
        });
        
        track.on("unmuted", () => {
          setIsSpeaking(true);
          setRobotState("speaking");
        });
      }
    });

    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      const isPlaying = room.canPlaybackAudio;
      // Only update if we're actually playing audio
      if (isPlaying) {
        setIsSpeaking(true);
        setRobotState("speaking");
      }
    });

    // Listen for messages via data channel (text, state updates, etc.)
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant) => {
      try {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        const senderIdentity = participant?.identity ?? "assistant";

        const data = JSON.parse(text);
        if (data.type === "message" && data.content) {
          const newMessage: Message = {
            id: Date.now().toString(),
            role: senderIdentity === room.localParticipant.identity ? "user" : "assistant",
            content: data.content,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, newMessage]);

          if (data.content.includes("?")) {
            setEmotionalState("confused");
          } else if (data.content.includes("!")) {
            setEmotionalState("surprised");
          }
        } else if (data.type === "state" && data.state) {
          setRobotState(data.state);
        } else if (data.type === "emotion" && data.emotion) {
          setEmotionalState(data.emotion);
        }
      } catch (e) {
        // Not JSON or unexpected payload; log and ignore
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
    if (audioAnalyzer) {
      const bufferLength = audioAnalyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDataArray = new Uint8Array(bufferLength);
      
      let animationFrameId: number;
      let lastAudioLevel = 0;
      
      const analyzeAudio = () => {
        if (!audioAnalyzer) {
          return;
        }
        
        // Get frequency data for amplitude analysis
        audioAnalyzer.getByteFrequencyData(dataArray);
        // Get time domain data for better real-time response
        audioAnalyzer.getByteTimeDomainData(timeDataArray);
        
        // Calculate RMS (Root Mean Square) from time domain for more accurate audio level
        let sumSquares = 0;
        let maxAmplitude = 0;
        for (let i = 0; i < timeDataArray.length; i++) {
          const normalized = Math.abs((timeDataArray[i] - 128) / 128);
          sumSquares += normalized * normalized;
          maxAmplitude = Math.max(maxAmplitude, normalized);
        }
        const rms = Math.sqrt(sumSquares / timeDataArray.length);
        // Use both RMS and peak amplitude for better detection
        const normalizedLevel = Math.min((rms * 0.7 + maxAmplitude * 0.3) * 5, 1); // Scale more aggressively for visibility
        
        // Calculate average frequency amplitude for additional smoothing
        let freqSum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          freqSum += dataArray[i];
        }
        const freqAverage = freqSum / dataArray.length;
        const freqLevel = Math.min(freqAverage / 128, 1);
        
        // Combine both for more accurate audio level (weight time domain more)
        const combinedLevel = (normalizedLevel * 0.8 + freqLevel * 0.2);
        
        // Smooth the transition (more responsive)
        const smoothedLevel = combinedLevel * 0.8 + lastAudioLevel * 0.2;
        lastAudioLevel = smoothedLevel;
        
        // Always update audio level (even if low) for smooth animation
        // Ensure minimum value when speaking to keep mouth visible
        const finalLevel = smoothedLevel > 0.01 ? Math.max(smoothedLevel, 0.1) : smoothedLevel;
        setAudioLevel(finalLevel);
        
        // Debug logging (remove in production)
        if (finalLevel > 0.1) {
          console.log("Audio level:", finalLevel.toFixed(3), "isSpeaking:", finalLevel > 0.05);
        }
        
        // Update isSpeaking based on actual audio activity (threshold to avoid noise)
        const hasAudioActivity = finalLevel > 0.05;
        if (hasAudioActivity) {
          setIsSpeaking(true);
          setRobotState("speaking");
        } else if (finalLevel < 0.02) {
          // Only set to listening if audio is very low
          setIsSpeaking(false);
          if (robotState !== "thinking" && robotState !== "idle") {
            setRobotState("listening");
          }
        }
        
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
        setFrequency(normalizedFreq * 3); // Scale for visualization
        
        // Update emotional state based on audio characteristics
        if (smoothedLevel > 0.7) {
          setEmotionalState("happy");
        } else if (smoothedLevel > 0.4) {
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
    } else {
      // No audio analyzer, reset states
      setAudioLevel(0);
      setFrequency(0);
      setIsSpeaking(false);
      }
  }, [audioAnalyzer, robotState]);

  const connect = useCallback(async (url?: string, token?: string) => {
    try {
      setRobotState("processing");
      
      // If URL and token are not provided, fetch from backend
      if (!url || !token) {
        // First get the LiveKit URL
        const urlResponse = await fetchFromBackend("/getLiveKitUrl");
        const urlData = await urlResponse.json();
        if (!urlData.url || urlData.url === "wss://your-livekit-server.com") {
          throw new Error("LiveKit URL not configured. Please set LIVEKIT_URL in your backend environment.");
        }
        url = urlData.url;

        // Then get the token
        const tokenResponse = await fetchFromBackend("/getToken?name=user");
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
