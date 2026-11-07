import { Suspense } from 'react';
import { ChatWorkspace } from '@/components/assistant/chat-workspace';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-[#8793aa]">Loading workspace…</div>}>
      <ChatWorkspace />
    </Suspense>
  );
}
