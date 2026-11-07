'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Activity,
  FileText,
  Layers3,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { Link, useRouter } from '@/i18n/navigation'
import { api } from '@/lib/api'
import { ApiError } from '@/lib/errors'
import { queryKeys } from '@/lib/query-keys'
import type { AssistantMode, ChatResponse, ConversationDetail } from '@/lib/types'
import { PageHeading } from '@/components/ui/page-heading'
import { ChatComposer } from './chat-composer'
import { ChatMessage, type ChatMessageData } from './chat-message'
import { ModeSelector } from './mode-selector'

type WorkspaceHealth = {
  features: { chat: boolean; rag: boolean; hybrid: boolean }
  documents_ready: boolean
  project: string
}

type WorkspaceDocuments = {
  count: number
  documents: { chunks: number }[]
}

export function ChatWorkspace() {
  const t = useTranslations('app')
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedConversationId = searchParams.get('conversation') || undefined

  const { data: health } = useQuery<WorkspaceHealth>({
    queryKey: queryKeys.health,
    queryFn: api.health,
  })
  const { data: documents } = useQuery<WorkspaceDocuments>({
    queryKey: queryKeys.documents,
    queryFn: api.documents,
  })

  const [mode, setMode] = useState<AssistantMode>('rag')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [conversationId, setConversationId] = useState<string>()
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const loadedConversationRef = useRef<string | undefined>(undefined)

  const selectedConversation = useQuery({
    queryKey: queryKeys.conversation(selectedConversationId || ''),
    queryFn: () => api.conversation(selectedConversationId!),
    enabled: Boolean(selectedConversationId),
  })

  useEffect(() => {
    const conversation = selectedConversation.data as ConversationDetail | undefined
    if (!conversation || loadedConversationRef.current === conversation.id) return

    loadedConversationRef.current = conversation.id
    setConversationId(conversation.id)
    setMode(conversation.mode)
    setMessages(
      conversation.messages
        .filter(message => message.role === 'user' || message.role === 'assistant')
        .map(message => ({
          id: message.id,
          role: message.role as 'user' | 'assistant',
          content: message.content,
          sources: message.extra_data?.sources || [],
        })),
    )
    setError('')
  }, [selectedConversation.data])

  useEffect(() => {
    if (!selectedConversationId) {
      if (loadedConversationRef.current) {
        loadedConversationRef.current = undefined
        setConversationId(undefined)
        setMessages([])
        setError('')
      }
      return
    }

    if (loadedConversationRef.current !== selectedConversationId) {
      setConversationId(undefined)
      setMessages([])
      setError('')
    }
  }, [selectedConversationId])

  const features = health?.features
  const modes = useMemo(
    () => ({
      rag: Boolean(features?.rag),
      hybrid: Boolean(features?.hybrid),
      chat: Boolean(features?.chat),
    }),
    [features],
  )
  const enabledModes = useMemo(
    () => (Object.keys(modes) as AssistantMode[]).filter(key => modes[key]),
    [modes],
  )
  const modeLabels: Record<AssistantMode, string> = {
    rag: t('rag'),
    hybrid: t('hybrid'),
    chat: t('chat'),
  }

  const activeMode = modes[mode] ? mode : (enabledModes[0] ?? 'rag')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMutation = useMutation({
    mutationFn: async ({
      question,
      assistantId,
    }: {
      question: string
      assistantId: string
    }) => {
      if (activeMode === 'rag') {
        const result = await api.stream(
          question,
          chunk => {
            setMessages(current =>
              current.map(message =>
                message.id === assistantId
                  ? { ...message, content: message.content + chunk, pending: false }
                  : message,
              ),
            )
          },
          conversationId,
        )
        return { kind: 'stream' as const, conversationId: result.conversationId }
      }

      return { kind: 'response' as const, data: await api.chat(question, activeMode, conversationId) }
    },
    onSuccess: async (result, variables) => {
      const returnedId =
        result.kind === 'stream'
          ? result.conversationId
          : (result.data as ChatResponse).conversation_id;

      if (returnedId) {
        setConversationId(returnedId);
        loadedConversationRef.current = returnedId;
        router.replace(`/dashboard?conversation=${encodeURIComponent(returnedId)}`);
      }

      if (result.kind === 'response') {
        const response = result.data as ChatResponse;
        setMessages(current =>
          current.map(message =>
            message.id === variables.assistantId
              ? {
                  ...message,
                  content: response.answer,
                  sources: response.sources,
                  pending: false,
                }
              : message,
          ),
        );
      } else {
        setMessages(current =>
          current.map(message =>
            message.id === variables.assistantId
              ? {
                  ...message,
                  pending: false,
                  content: message.content || t('emptyAnswer'),
                }
              : message,
          ),
        );
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
    onError: (cause: Error, variables) => {
      const isLlmForbidden =
        (cause instanceof ApiError && cause.status === 403) ||
        /LLM provider returned HTTP 403/i.test(cause.message) ||
        /HTTP\\s*403/i.test(cause.message)

      if (isLlmForbidden) {
        toast.error(t('llmForbidden'), {
          description: t('vpnSuggestion'),
          duration: 7000,
        })
      }

      setError(cause.message)
      setMessages(current =>
        current.map(message =>
          message.id === variables.assistantId
            ? { ...message, content: cause.message, pending: false }
            : message,
        ),
      )
    },
  })

  const sendMessage = () => {
    const question = input.trim()
    if (!question || !features || sendMutation.isPending) return

    if (activeMode === 'rag' && !health?.documents_ready) {
      setError(t('noDocs'))
      return
    }

    const assistantId = crypto.randomUUID()
    setMessages(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
      },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        pending: true,
      },
    ])
    setInput('')
    setError('')
    sendMutation.mutate({ question, assistantId })
  }

  const startNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    loadedConversationRef.current = undefined;
    setError('');
    router.replace('/dashboard');
  }

  const stats = [
    {
      label: t('documents'),
      value: documents?.count ?? '—',
      icon: FileText,
      color: 'text-[#a99cff] bg-[#8e7df0]/10',
    },
    {
      label: t('chunks'),
      value:
        documents?.documents.reduce((total, item) => total + item.chunks, 0) ??
        '—',
      icon: Layers3,
      color: 'text-[#70d8e7] bg-[#56c7d8]/10',
    },
    {
      label: t('connection'),
      value: health?.project ?? t('notConnected'),
      icon: Activity,
      color: 'text-[#6bd9b4] bg-[#5ed5ae]/10',
    },
  ]

  return (
    <>
      <PageHeading
        eyebrow={t('assistantLabel')}
        title={t('assistant')}
        description={t('welcomeSub')}
        action={
          <button
            onClick={startNewChat}
            className="focus-ring flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.035] px-3.5 py-2.5 text-xs text-[#cbd2e4] transition hover:border-[#8e80f4]/40 hover:bg-[#8e80f4]/10">
            <Plus size={15} />
            {t('newChat')}
          </button>
        }
      />

      {selectedConversation.isLoading && selectedConversationId && (
        <div className="mb-4 text-xs text-[#8793aa]">{t('loading')}</div>
      )}
      {selectedConversation.isError && selectedConversationId && (
        <div role="alert" className="mb-4 rounded-xl border border-[#e49a83]/20 bg-[#e49a83]/[.07] p-3 text-xs text-[#eab4a4]">
          {t('conversationLoadError')}
        </div>
      )}

      {selectedConversation.isLoading && selectedConversationId && (
        <div className="mb-4 text-xs text-[#8793aa]">{t('loading')}</div>
      )}
      {selectedConversation.isError && selectedConversationId && (
        <div role="alert" className="mb-4 rounded-xl border border-[#e49a83]/20 bg-[#e49a83]/[.07] p-3 text-xs text-[#eab4a4]">
          {t('conversationLoadError')}
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="glass flex items-center gap-3.5 rounded-2xl px-4 py-3.5">
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${color}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#7e8aa2]">{label}</div>
              <div className="mt-0.5 truncate text-[15px] font-semibold text-[#e8ebf7]">
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!health && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e4ad69]/20 bg-[#e4ad69]/[.07] px-4 py-3 text-xs text-[#e7c18e]">
          <span>{t('connectPrompt')}</span>
          <Link
            href="/settings"
            className="rounded-lg border border-[#e4ad69]/25 px-3 py-2 font-semibold hover:bg-white/5">
            {t('settings')}
          </Link>
        </div>
      )}

      <section className="glass relative flex min-h-[530px] flex-col overflow-hidden rounded-[24px] border-white/[.09] lg:min-h-[calc(100vh-300px)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#7164d5]/[.07] to-transparent" />

        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#9284ff]/20 to-[#5bc5d6]/10 text-[#b5adff]">
              <Sparkles size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#e2e6f4]">
                Nexa AI
              </div>
              <div className="mt-0.5 text-[10px] text-[#77839b]">
                {health?.documents_ready
                  ? t('documentsReady')
                  : t('assistantLabel')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModeSelector
              value={activeMode}
              onChange={setMode}
              enabled={modes}
              labels={modeLabels}
            />
            <button
              onClick={startNewChat}
              className="rounded-lg p-2 text-[#77849c] hover:bg-white/5 hover:text-white"
              title={t('clear')}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          {messages.length === 0 ? (
            <EmptyChat
              title={t('welcome')}
              description={t('welcomeSub')}
              onSuggestion={setInput}
            />
          ) : (
            <div className="mx-auto w-full max-w-4xl space-y-6">
              {messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  youLabel={t('you')}
                  thinkingLabel={t('thinking')}
                  sourcesLabel={t('sources')}
                  scoreLabel={t('score')}
                  emptyLabel={t('emptyAnswer')}
                />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 mb-3 rounded-xl border border-[#e49a83]/20 bg-[#e49a83]/[.07] p-3 text-xs text-[#eab4a4] sm:mx-6">
            {error}
          </div>
        )}

        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          placeholder={t('ask')}
          sendLabel={t('send')}
          modeLabel={modeLabels[activeMode]}
          hint={activeMode === 'rag' ? t('streamingNote') : t('chatNote')}
          disabled={!features || sendMutation.isPending}
        />
      </section>
    </>
  )
}

function EmptyChat({
  title,
  description,
  onSuggestion,
}: {
  title: string
  description: string
  onSuggestion: (value: string) => void
}) {
  const t = useTranslations('Assistant')
  const suggestions = [t('suggestion1'), t('suggestion2'), t('suggestion3')]

  return (
    <div className="m-auto flex max-w-xl flex-col items-center py-12 text-center">
      <div className="dot-grid relative mb-7 grid size-24 place-items-center rounded-[30px] border border-[#9588ff]/20 bg-gradient-to-br from-[#7869dd]/15 to-[#45b8c9]/10 shadow-[0_0_70px_rgba(118,103,223,.13)]">
        <div className="absolute inset-3 rounded-[22px] border border-white/[.06]" />
        <Sparkles size={34} strokeWidth={1.3} className="text-[#b4aaff]" />
      </div>
      <h2 className="gradient-text text-[22px] font-semibold sm:text-[26px]">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-[13px] leading-7 text-[#8490a7]">
        {description}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {suggestions.map(suggestion => (
          <button
            key={suggestion}
            onClick={() => onSuggestion(suggestion)}
            className="rounded-full border border-white/[.09] bg-white/[.025] px-3.5 py-2 text-[11px] text-[#a5afc4] transition hover:border-[#8e80f4]/40 hover:bg-[#8e80f4]/10 hover:text-white">
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
