'use client';

import { useState } from 'react';
import { MessageSquareText, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { ConversationSummary } from '@/lib/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function ConversationHistory({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const t = useTranslations('app');
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [conversationToDelete, setConversationToDelete] =
    useState<ConversationSummary | null>(null);

  const history = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: () => api.conversations(50),
  });

  const removeConversation = useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),

    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.conversations,
      });

      await queryClient.removeQueries({
        queryKey: queryKeys.conversation(id),
      });

      const currentId =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('conversation')
          : null;

      if (pathname === '/dashboard' && currentId === id) {
        router.replace('/dashboard');
      }

      setConversationToDelete(null);
      toast.success(t('conversationDeleted'));
    },

    onError: () => {
      toast.error(t('error'));
    },
  });

  const openConversation = (id: string) => {
    router.push(`/dashboard?conversation=${encodeURIComponent(id)}`);
    onNavigate();
  };

  const confirmDelete = () => {
    if (conversationToDelete) {
      removeConversation.mutate(conversationToDelete.id);
    }
  };

  return (
    <>
      <section aria-label={t('chatHistory')}>
        <div className="my-5 h-px bg-white/[.07]" />

        <div className="mb-3 flex items-center justify-between px-3">
          <span className="text-[10px] font-semibold tracking-[.16em] text-[#65718a]">
            {t('chatHistory').toUpperCase()}
          </span>
          <span className="rounded-md bg-white/[.06] px-1.5 py-0.5 text-[10px] text-[#9ba6bc]">
            {history.data?.count ?? 0}
          </span>
        </div>

        <div className="max-h-[34vh] space-y-1 overflow-y-auto pe-1">
          {history.isLoading && (
            <p className="px-3 py-2 text-[11px] text-[#65718a]">
              {t('historyLoading')}
            </p>
          )}

          {history.isError && (
            <button
              type="button"
              onClick={() => void history.refetch()}
              className="px-3 py-2 text-start text-[11px] text-[#e0a88f] hover:text-white"
            >
              {t('historyError')}
            </button>
          )}

          {history.data?.conversations.map(conversation => (
            <div
              key={conversation.id}
              className="group flex items-center gap-1"
            >
              <button
                type="button"
                onClick={() => openConversation(conversation.id)}
                title={conversation.title}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-start text-xs text-[#9aa6bc] transition hover:bg-white/[.05] hover:text-white"
              >
                <MessageSquareText
                  size={14}
                  className="shrink-0 text-[#8178c8]"
                />
                <span className="truncate">
                  {conversation.title || t('newChat')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConversationToDelete(conversation)}
                disabled={removeConversation.isPending}
                title={t('deleteConversation')}
                aria-label={`${t('deleteConversation')}: ${conversation.title}`}
                className="grid size-7 shrink-0 place-items-center rounded-md text-[#69758c] opacity-0 transition hover:bg-[#e49a83]/10 hover:text-[#e6a18e] group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {history.data?.conversations.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-[#65718a]">
              {t('noChatHistory')}
            </p>
          )}
        </div>
      </section>

      {conversationToDelete && (
        <ConfirmDialog
          title={t('deleteConversation')}
          description={t('deleteConversationConfirm')}
          value={conversationToDelete.title}
          confirmLabel={t('confirmDelete')}
          cancelLabel={t('cancel')}
          busy={removeConversation.isPending}
          onConfirm={confirmDelete}
          onClose={() => {
            if (!removeConversation.isPending) {
              setConversationToDelete(null);
            }
          }}
        />
      )}
    </>
  );
}
