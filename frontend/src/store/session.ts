import { ChatSessionType } from "@/lib/requests";
import { create } from "zustand";

interface SessionState {
  active?: ChatSessionType;
  all: { id: number; name: string; created_at: Date }[];
  set_active: (session: ChatSessionType) => void;
  set_sessions: (session: ChatSessionType[]) => void;
  delete_active: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  session: undefined,
  all: [],
  set_active: (session: ChatSessionType) => set({ active: session }),
  set_sessions: (sessions: ChatSessionType[]) => set({ all: sessions }),
  delete_active: () => set({ active: undefined }),
}));
