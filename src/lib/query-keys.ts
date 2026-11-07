export const queryKeys = {
  health: ['health'] as const,
  documents: ['documents'] as const,
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
};
