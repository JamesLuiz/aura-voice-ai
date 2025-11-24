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

    room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(payload));
      
      if (data.type === "transcript") {
        const newMessage: Message = {
          id: Date.now().toString(),
          role: data.role,
          content: data.text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
      } else if (data.type === "state") {
        setRobotState(data.state);
      }
    });

    return () => {
      room.removeAllListeners();
      room.disconnect();
    };
  }, [room, volume]);

  // Simulate audio level for lip sync
  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 0.5 + 0.5);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isSpeaking]);

  const connect = useCallback(async (url: string, token: string) => {
    try {
      setRobotState("processing");
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

  const sendMessage = useCallback((text: string) => {
    if (!isConnected) return;

    const message: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, message]);

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ text }));
    room.localParticipant.publishData(data, { reliable: true });
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
  };
};
