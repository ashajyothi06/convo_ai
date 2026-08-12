export type User = {
  id: string;
  email: string;
  name: string;
};

export type TranscriptTurn = {
  turn_id: string;
  role: "user" | "assistant";
  transcript: string;
  created_at: string;
  interrupted?: boolean;
  response_id?: string | null;
};

export type PanditBookingSummary = {
  name: string | null;
  phone: string | null;
  service: string | null;
  schedule: string | null;
  duration: string | null;
  address: string | null;
};

export type VoiceConfig = {
  model: string;
  voice: string;
  assistant_name: string;
  max_call_minutes: number;
  instructions: string;
};

export type LoginResponse = {
  token: string;
  expires_at: string;
  user: User;
};

export type CallStartResponse = {
  call_id: string;
  public_summary: PanditBookingSummary;
};