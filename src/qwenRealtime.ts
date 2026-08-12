import { exchangeSdp } from "./api";
import type { TranscriptTurn, VoiceConfig } from "./types";

type RealtimeCallbacks = {
  onUserTurn: (turn: TranscriptTurn) => void;
  onAssistantTurn: (turn: TranscriptTurn) => void;
  onConnectionState: (state: string) => void;
  onSpeakingChange: (speaking: boolean) => void;
  onError: (message: string) => void;
};

export class QwenRealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private channels = new Set<RTCDataChannel>();
  private remoteAudio: HTMLAudioElement | null = null;
  private activeResponseId: string | null = null;
  private interruptedResponseIds = new Set<string>();
  private disconnectTimer: number | null = null;
  private connectedOnce = false;
  private sessionConfigured = false;

  constructor(
    private readonly callId: string,
    private readonly config: VoiceConfig,
    private readonly callbacks: RealtimeCallbacks
  ) {}

  async connect(remoteAudio: HTMLAudioElement): Promise<void> {
    this.remoteAudio = remoteAudio;

    const pc = new RTCPeerConnection({ iceServers: [] });
    this.pc = pc;

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    for (const track of this.localStream.getAudioTracks()) {
      pc.addTrack(track, this.localStream);
    }

    // A local DataChannel ensures DataChannel negotiation is included in SDP.
    const triggerChannel = pc.createDataChannel("oai-events");
    this.bindDataChannel(triggerChannel);

    pc.addEventListener("datachannel", (event) => {
      this.bindDataChannel(event.channel);
    });

    pc.addEventListener("track", (event) => {
      if (event.track.kind !== "audio") return;

      this.remoteStream =
        event.streams[0] ||
        new MediaStream([event.track]);

      remoteAudio.srcObject = this.remoteStream;
      remoteAudio.autoplay = true;
      void remoteAudio.play().catch(() => undefined);
    });

    pc.addEventListener("connectionstatechange", () => {
      const state = pc.connectionState;
      this.callbacks.onConnectionState(state);

      if (state === "connected") {
        this.connectedOnce = true;

        if (this.disconnectTimer) {
          window.clearTimeout(this.disconnectTimer);
          this.disconnectTimer = null;
        }
      }

      if (
        state === "disconnected" &&
        this.connectedOnce &&
        !this.disconnectTimer
      ) {
        this.disconnectTimer = window.setTimeout(() => {
          if (
            this.pc === pc &&
            ["disconnected", "failed"].includes(pc.connectionState)
          ) {
            this.callbacks.onError("Voice connection was lost.");
          }

          this.disconnectTimer = null;
        }, 15000);
      }

      if (state === "failed") {
        this.callbacks.onError("WebRTC connection failed.");
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await this.waitForIceGatheringComplete(pc);

    const localSdp = pc.localDescription?.sdp;

    if (!localSdp) {
      throw new Error("Unable to create WebRTC offer.");
    }

    const answerSdp = await exchangeSdp(
      this.callId,
      localSdp
    );

    await pc.setRemoteDescription({
      type: "answer",
      sdp: answerSdp
    });
  }

  setMuted(muted: boolean): void {
    for (
      const track of
      this.localStream?.getAudioTracks() || []
    ) {
      track.enabled = !muted;
    }
  }

  async close(): Promise<void> {
    if (this.disconnectTimer) {
      window.clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }

    this.callbacks.onSpeakingChange(false);

    for (const channel of this.channels) {
      try {
        channel.close();
      } catch {
        // Already closed.
      }
    }

    this.channels.clear();

    for (
      const track of
      this.localStream?.getTracks() || []
    ) {
      track.stop();
    }

    try {
      this.pc?.close();
    } catch {
      // Already closed.
    }

    if (this.remoteAudio) {
      this.remoteAudio.pause();
      this.remoteAudio.srcObject = null;
    }

    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.connectedOnce = false;
    this.sessionConfigured = false;
    this.activeResponseId = null;
    this.interruptedResponseIds.clear();
  }

  private bindDataChannel(
    channel: RTCDataChannel
  ): void {
    this.channels.add(channel);

    channel.addEventListener("open", () => {
      this.sendSessionUpdateOnce();
    });

    channel.addEventListener("close", () => {
      this.channels.delete(channel);
    });

    channel.addEventListener("message", (messageEvent) => {
      let event: any;

      try {
        event = JSON.parse(
          String(messageEvent.data)
        );
      } catch {
        return;
      }

      this.handleServerEvent(event);
    });
  }

  private sendSessionUpdateOnce(): void {
    if (this.sessionConfigured) return;

    // Prefer the Qwen-created "txt" channel for control events.
    const channel =
      [...this.channels].find(
        (item) =>
          item.readyState === "open" &&
          item.label === "txt"
      ) ||
      [...this.channels].find(
        (item) => item.readyState === "open"
      );

    if (!channel) return;

    channel.send(
      JSON.stringify({
        type: "session.update",

        session: {
          modalities: [
            "text",
            "audio"
          ],

          voice:
            this.config.voice,

          instructions:
            this.config.instructions,

          input_audio_transcription: {
            model:
              "qwen3-asr-flash-realtime"
          },

          turn_detection: {
            type:
              "server_vad",

            threshold:
              0.5,

            silence_duration_ms:
              800
          },

          max_tokens:
            160
        }
      })
    );

    this.sessionConfigured = true;
  }

  private handleServerEvent(event: any): void {
    const type =
      String(event?.type || "");

    if (type === "response.created") {
      this.activeResponseId =
        event.response?.id || null;

      // This drives only the UI waveform/status.
      // It does NOT modify the avatar image or lips.
      this.callbacks.onSpeakingChange(true);
      return;
    }

    if (
      type ===
      "input_audio_buffer.speech_started"
    ) {
      if (this.activeResponseId) {
        this.interruptedResponseIds.add(
          this.activeResponseId
        );
      }

      return;
    }

    if (
      type ===
      "conversation.item.input_audio_transcription.completed"
    ) {
      const transcript =
        String(
          event.transcript || ""
        ).trim();

      if (!transcript) return;

      this.callbacks.onUserTurn({
        turn_id:
          event.item_id ||
          crypto.randomUUID(),

        role:
          "user",

        transcript,

        created_at:
          new Date().toISOString(),

        interrupted:
          false
      });

      return;
    }

    if (
      type ===
      "response.audio_transcript.done"
    ) {
      const transcript =
        String(
          event.transcript || ""
        ).trim();

      if (!transcript) return;

      const responseId =
        event.response_id ||
        this.activeResponseId ||
        null;

      this.callbacks.onAssistantTurn({
        turn_id:
          event.item_id ||
          crypto.randomUUID(),

        response_id:
          responseId,

        role:
          "assistant",

        transcript,

        created_at:
          new Date().toISOString(),

        interrupted:
          Boolean(responseId) &&
          this.interruptedResponseIds.has(
            String(responseId)
          )
      });

      return;
    }

    if (type === "response.done") {
      const responseId =
        event.response?.id ||
        this.activeResponseId;

      if (responseId) {
        const status =
          event.response?.status || "";

        const reason =
          event.response
            ?.status_details
            ?.reason || "";

        if (
          status === "cancelled" &&
          [
            "turn_detected",
            "client_cancelled"
          ].includes(reason)
        ) {
          this.interruptedResponseIds.add(
            String(responseId)
          );
        }
      }

      this.activeResponseId = null;
      this.callbacks.onSpeakingChange(false);
      return;
    }

    if (type === "error") {
      this.callbacks.onSpeakingChange(false);

      this.callbacks.onError(
        String(
          event.error?.message ||
          "Qwen realtime returned an error."
        )
      );
    }
  }

  private async waitForIceGatheringComplete(
    pc: RTCPeerConnection
  ): Promise<void> {
    if (
      pc.iceGatheringState === "complete"
    ) {
      return;
    }

    await new Promise<void>((resolve) => {
      const handler = () => {
        if (
          pc.iceGatheringState ===
          "complete"
        ) {
          pc.removeEventListener(
            "icegatheringstatechange",
            handler
          );

          resolve();
        }
      };

      pc.addEventListener(
        "icegatheringstatechange",
        handler
      );
    });
  }
}
