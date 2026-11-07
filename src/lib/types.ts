export type AssistantMode = 'rag' | 'chat' | 'hybrid';

export interface HealthResponse {
  status: string;
  project: string;
  features: {
    chat: boolean;
    rag: boolean;
    hybrid: boolean;
  };
  documents_ready: boolean;
}

export interface DocumentItem {
  filename: string;
  chunks: number;
  status: string;
}

export interface DocumentsResponse {
  project: string;
  count: number;
  documents: DocumentItem[];
}

export interface SourceItem {
  source: string;
  chunk_id: string | number | null;
  score?: number | null;
  dense_score?: number | null;
  bm25_score?: number | null;
  hybrid_score?: number | null;
  rerank_score?: number | null;
}

export interface ChatResponse {
  answer: string;
  sources: SourceItem[];
  conversation_id?: string;
  project_id?: string;
}

export interface ApiSettings {
  apiKey: string;
}

export interface AuthUser {
  id: string;
  username: string;
  project_id?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

export interface AuthSessionResponse {
  user: {
    id: string;
    username: string;
  };
  project_id: string;
  expires_in: number;
  csrf_token: string;
}

export type RegisterResponse = AuthSessionResponse;

export interface ConversationSummary {
  id: string;
  title: string;
  mode: AssistantMode;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationsResponse {
  count: number;
  conversations: ConversationSummary[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  extra_data?: {
    mode?: AssistantMode;
    sources?: SourceItem[];
  };
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  mode: AssistantMode;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}
