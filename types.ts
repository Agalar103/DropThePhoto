
export type Gender = 'Erkek' | 'Kadın' | 'Trans';

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  bio: string;
  photoUrl: string;
}

export interface PhotoBox {
  id: string;
  lat: number;
  lng: number;
  note: string;
  photoUrl: string;
  creator: Profile;
  createdAt: number;
  expiresAt: number;
  isFake?: boolean;
}

export interface User extends Profile {
  email: string;
  isPremium: boolean;
  dropsRemaining: number;
  lastResetTime: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  photoUrl?: string; // Fotoğraf mesajları için
  timestamp: number;
  type?: 'text' | 'voice' | 'photo';
  duration?: number;
}

export interface Chat {
  id: string;
  participant: Profile;
  messages: ChatMessage[];
  status: 'pending' | 'accepted' | 'blocked';
}

export type DangerLevel = 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface LoreData {
  summary: string;
  vibe: string;
  status: string;
  dangerLevel: DangerLevel;
}
