import { useState, useEffect, useCallback, useRef } from "react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteAudioTrack,
  Participant,
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

  // --- Fetch Helpers (Unchanged) ---
  const fetchWithTimeout = useCallback(async (url: string, options?: RequestInit, timeout = 4000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  const fetchFromBackend = useCallback(async (path: string, options?: RequestInit) => {
    const endpoints = [ `${LOCAL_BACKEND}${path}`, `${RENDER_BACKEND}${path}` ];
    for (const url of endpoints) {
      try {
        const response = url.startsWith(LOCAL_BACKEND) ? await fetchWithTimeout(url, options) : await fetch(url, options);
        if (response.ok) return response;
      } catch (error) { console.warn(`Backend request to ${url} failed:`, error); }
    }
    throw new Error("Unable to reach backend server.");
  }, [LOCAL_BACKEND, RENDER_BACKEND, fetchWithTimeout]);
  
  // --- State ---
  const [room] = useState(() => new Room());
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [volume, setVolume] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [robotState, setRobotState] = useState<RobotState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>("neutral");
  const [localVideoTrack, setLocalVideoTrack] = useState<any>(null);

  // --- Refs for Audio Analysis ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyzerRef = useRef<AnalyserNode | null>(null);
  const agentParticipantRef = useRef<Participant | null>(null);
  
  // Track the *actual* speaking state from LiveKit events as a fallback
  const isAgentSpeakingLiveKitRef = useRef(false);

  useEffect(() => {
    // 1. Connection Handlers
    room.on(RoomEvent.Connected, () => {
      setIsConnected(true);
      setRobotState("listening");
    });

    room.on(RoomEvent.Disconnected, () => {
      setIsConnected(false);
      setIsSpeaking(false);
      isAgentSpeakingLiveKitRef.current = false;
      setRobotState("idle");
    });

    // 2. Track Subscription (Audio Setup)
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio && participant.identity !== room.localParticipant.identity) {
        console.log("🎤 Agent Audio Track Subscribed");
        agentParticipantRef.current = participant;

        const audioTrack = track as RemoteAudioTrack;
        
        // CRITICAL FIX: Set crossOrigin to anonymous BEFORE attaching
        // This allows the AudioContext to read the data without security errors
        const element = audioTrack.attach();
        element.crossOrigin = "anonymous";
        element.volume = volume;
        document.body.appendChild(element);

        // Resume AudioContext on user interaction if needed
        const resumeContext = () => {
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }
        };
        window.addEventListener('click', resumeContext);
        window.addEventListener('touchstart', resumeContext);

        try {
            // Setup Audio Context
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyzer = ctx.createAnalyser();
            analyzer.fftSize = 256;
            
            // Connect Source -> Analyzer -> Destination
            const source = ctx.createMediaElementSource(element);
            source.connect(analyzer);
            analyzer.connect(ctx.destination);
            
            audioContextRef.current = ctx;
            audioAnalyzerRef.current = analyzer;
        } catch (e) {
            console.error("Audio Analysis Setup Failed:", e);
        }
      }
    });

    // 3. Fallback Event Listeners (Voice Activity Detection)
    // If the browser blocks the analyzer, we use these events to know when to "fake" the mouth movement
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isAgentSpeaking = speakers.some(s => s.identity !== room.localParticipant.identity);
        isAgentSpeakingLiveKitRef.current = isAgentSpeaking;
    });

    // 4. Data Messages (Chat)
    room.on(RoomEvent.DataReceived, (payload, participant) => {
        const decoder = new TextDecoder();
        const text = decoder.decode(payload);
        const sender = participant?.identity ?? "assistant";
        try {
            const data = JSON.parse(text);
            if (data.type === "message" && data.content) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: sender === room.localParticipant.identity ? "user" : "assistant", content: data.content, timestamp: new Date() }]);
                if (data.content.includes("?")) setEmotionalState("confused");
                else if (data.content.includes("!")) setEmotionalState("surprised");
            } else if (data.type === "state") setRobotState(data.state);
            else if (data.type === "emotion") setEmotionalState(data.emotion);
        } catch(e) { console.error(e); }
    });

    return () => {
      room.removeAllListeners();
      room.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [room, volume]);


  // --- THE FIXED ANIMATION LOOP ---
  useEffect(() => {
    let animationFrameId: number;
    const dataArray = new Uint8Array(128);
    
    const analyzeAudio = () => {
      let currentLevel = 0;
      let calculatedFrequency = 0;

      // Try to get REAL audio data
      if (audioAnalyzerRef.current) {
        try {
            audioAnalyzerRef.current.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            // Normalize 0-255 to 0-1
            currentLevel = (sum / dataArray.length) / 128; 
            calculatedFrequency = currentLevel * 3;
        } catch (e) {
            // Ignore analysis errors
        }
      }

      // --- THE FALLBACK LOGIC ---
      // If Real Level is 0 (browser blocked it) BUT LiveKit says agent is speaking...
      // We generate fake data so the mouth moves.
      if (currentLevel < 0.01 && isAgentSpeakingLiveKitRef.current) {
          // Generate a smooth-ish random wave between 0.2 and 0.6
          const time = Date.now() / 100;
          currentLevel = 0.2 + Math.abs(Math.sin(time)) * 0.4;
          calculatedFrequency = Math.random() * 2;
      }

      // Apply updates
      setAudioLevel(currentLevel);
      setFrequency(calculatedFrequency);
      
      const threshold = 0.05;
      const isActuallySpeaking = currentLevel > threshold;

      // Update React State only on change to prevent re-render thrashing
      setIsSpeaking(prev => {
          if (prev !== isActuallySpeaking) {
              // Update robot state as side effect of speaking change
              setRobotState(curr => {
                  if (isActuallySpeaking) return "speaking";
                  if (curr === "speaking") return "listening";
                  return curr;
              });
              return isActuallySpeaking;
          }
          return prev;
      });

      animationFrameId = requestAnimationFrame(analyzeAudio);
    };

    analyzeAudio();
    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Empty dependency array = runs forever

  // --- Helpers (Unchanged) ---
  const connect = useCallback(async (url?: string, token?: string) => {
    try {
      setRobotState("processing");
      if (!url || !token) {
         const urlRes = await fetchFromBackend("/getLiveKitUrl");
         const urlData = await urlRes.json();
         url = urlData.url;
         const tokRes = await fetchFromBackend("/getToken?name=user");
         const tokData = await tokRes.json();
         token = tokData.token;
      }
      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsListening(true);
      const vTrack = await room.localParticipant.setCameraEnabled(true);
      if(vTrack) { setLocalVideoTrack(vTrack); setIsVideoEnabled(true); }
    } catch (e) { console.error(e); setRobotState("error"); throw e; }
  }, [room, fetchFromBackend]);

  const disconnect = useCallback(() => { room.disconnect(); setMessages([]); setLocalVideoTrack(null); setIsVideoEnabled(false); }, [room]);
  const toggleMute = useCallback(async () => { const s = !isMuted; await room.localParticipant.setMicrophoneEnabled(!s); setIsMuted(s); setIsListening(!s); }, [room, isMuted]);
  const toggleVideo = useCallback(async () => { 
      const s = !isVideoEnabled; 
      if(s) { const t = await room.localParticipant.setCameraEnabled(true); if(t) { setLocalVideoTrack(t); setIsVideoEnabled(true); }} 
      else { await room.localParticipant.setCameraEnabled(false); setLocalVideoTrack(null); setIsVideoEnabled(false); }
  }, [room, isVideoEnabled]);
  const changeVolume = useCallback((v: number) => setVolume(v), []);
  const sendMessage = useCallback(async (t: string) => { 
      if(!isConnected || !t.trim()) return; 
      setMessages(p => [...p, { id: Date.now().toString(), role: "user", content: t, timestamp: new Date() }]);
      try { await room.localParticipant.sendText(t, { topic: 'lk.chat' }); } 
      catch(e) { console.error(e); }
  }, [room, isConnected]);

  return { connect, disconnect, toggleMute, toggleVideo, changeVolume, sendMessage, isConnected, isSpeaking, isListening, isMuted, isVideoEnabled, volume, messages, robotState, audioLevel, frequency, emotionalState, localVideoTrack };
};