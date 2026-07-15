"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/// <reference types="dom-speech-recognition" />

/**
 * Voice for the chatbot, using the browser's built-in Web Speech API.
 *
 * Why the browser and not OpenAI's audio endpoints:
 *  - It is free. Speech costs nothing per character, so voice cannot surprise us
 *    with a bill the way a paid TTS endpoint would.
 *  - It is instant: no network round-trip, so the reply starts speaking as soon
 *    as it is on screen.
 *  - It needs no API key, so voice works even before OPENAI_API_KEY is set.
 *
 * Both halves degrade gracefully: where a browser lacks the API (Firefox has no
 * SpeechRecognition), `supported` is false and the UI hides that control rather
 * than showing a button that does nothing.
 *
 * Feature detection and the saved preference are read with `useSyncExternalStore`
 * rather than `useEffect` + `setState`: they are external browser state, and this
 * is the pattern that gives a correct server snapshot (so no hydration mismatch)
 * without a cascading re-render.
 */

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Neither capability can appear or disappear at runtime, so nothing to subscribe to. */
const subscribeNever = () => () => {};

const getRecognitionSupported = () => getRecognitionCtor() !== null;
const getSynthesisSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;
/** On the server neither exists — render the UI as unsupported, then hydrate. */
const getSupportedOnServer = () => false;

export type VoiceInput = {
  supported: boolean;
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
};

/** Speech-to-text. Calls `onTranscript` with the final text when the user stops. */
export function useVoiceInput(onTranscript: (text: string) => void): VoiceInput {
  const supported = useSyncExternalStore(
    subscribeNever,
    getRecognitionSupported,
    getSupportedOnServer,
  );
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Keep the newest callback without tearing down the recognition object.
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) onTranscriptRef.current(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      // "aborted" just means stop() was called — not worth alarming the user.
      if (event.error === "aborted") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings."
          : "Couldn't hear that — please try again.",
      );
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setError(null);
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() throws if it is already running — treat as a no-op.
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Nothing to stop.
    }
    setListening(false);
  }, []);

  return { supported, listening, error, start, stop };
}

/* -------------------------------------------------------------------------- */
/*  Voice-output preference: a tiny external store backed by localStorage.     */
/*  Kept outside React so the value survives remounts (the popover unmounts    */
/*  every time it closes) and so getSnapshot stays pure.                       */
/* -------------------------------------------------------------------------- */

const VOICE_PREF_KEY = "nvx-chat-voice";
const prefListeners = new Set<() => void>();

function subscribeVoicePref(listener: () => void) {
  prefListeners.add(listener);
  return () => {
    prefListeners.delete(listener);
  };
}

function getVoicePref(): boolean {
  try {
    return window.localStorage.getItem(VOICE_PREF_KEY) === "on";
  } catch {
    // Private mode / storage blocked.
    return false;
  }
}

function getVoicePrefOnServer(): boolean {
  return false;
}

function setVoicePref(enabled: boolean): void {
  try {
    window.localStorage.setItem(VOICE_PREF_KEY, enabled ? "on" : "off");
  } catch {
    // The preference just will not persist.
  }
  for (const listener of prefListeners) listener();
}

export type VoiceOutput = {
  supported: boolean;
  speaking: boolean;
  enabled: boolean;
  toggleEnabled: () => void;
  speak: (text: string) => void;
  cancel: () => void;
};

/** Text-to-speech. Off by default — audio that starts by itself is hostile. */
export function useVoiceOutput(): VoiceOutput {
  const supported = useSyncExternalStore(
    subscribeNever,
    getSynthesisSupported,
    getSupportedOnServer,
  );
  const enabled = useSyncExternalStore(subscribeVoicePref, getVoicePref, getVoicePrefOnServer);
  const [speaking, setSpeaking] = useState(false);

  // The speech queue is global and outlives this component: a user who closes the
  // chat mid-sentence must not keep hearing it.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const toggleEnabled = useCallback(() => {
    const next = !getVoicePref();
    setVoicePref(next);
    if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = text.trim();
      if (!clean) return;

      // Never let two replies talk over each other.
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [enabled],
  );

  return { supported, speaking, enabled, toggleEnabled, speak, cancel };
}
