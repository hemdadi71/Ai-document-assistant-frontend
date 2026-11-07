'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';

import { api, getSettings, saveSettings } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { HealthResponse } from '@/lib/types';

import { PageHeading } from '@/components/ui/page-heading';
import { ApiSettingsForm } from './api-settings-form';
import { ConnectionStatus } from './connection-status';

function subscribeToSettings(onChange: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  window.addEventListener('nexa-settings-updated', onChange);
  window.addEventListener('storage', onChange);

  return () => {
    window.removeEventListener('nexa-settings-updated', onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getApiKeySnapshot() {
  return getSettings().apiKey;
}

function getServerApiKeySnapshot() {
  return '';
}

export function SettingsPage() {
  const t = useTranslations('app');
  const queryClient = useQueryClient();

  const apiKey = useSyncExternalStore(
    subscribeToSettings,
    getApiKeySnapshot,
    getServerApiKeySnapshot,
  );

  const [health, setHealth] = useState<HealthResponse>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.health()
      .then(result => {
        if (active) setHealth(result);
      })
      .catch(() => {
        if (active) setHealth(undefined);
      });

    return () => {
      active = false;
    };
  }, []);

  const save = async (newApiKey: string) => {
    setSaving(true);
    setError('');

    try {
      saveSettings({ apiKey: newApiKey });

      const result = await api.health();
      setHealth(result);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
        queryClient.invalidateQueries({ queryKey: queryKeys.documents }),
      ]);
    } catch (cause) {
      setHealth(undefined);
      setError(cause instanceof Error ? cause.message : t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow="PREFERENCES"
        title={t('settings')}
        description={t('connection')}
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-[#e49a83]/20 bg-[#e49a83]/[.07] p-3 text-xs text-[#eab4a4]"
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="glass rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <Settings2 size={17} className="text-[#a99eff]" />
            <h2 className="text-sm font-semibold">API configuration</h2>
          </div>

          <ApiSettingsForm
            initialApiKey={apiKey}
            onSave={save}
            saving={saving}
            labels={{
              apiKey: t('apiKey'),
              securityNote: t('securityNote'),
              save: t('save'),
              apiKeyLength: t('apiKeyLength'),
            }}
          />
        </section>

        <ConnectionStatus
          health={health}
          labels={{
            connection: t('connection'),
            connected: t('connected'),
            notConnected: t('notConnected'),
            chatEnabled: t('chatEnabled'),
            ragEnabled: t('ragEnabled'),
            hybridEnabled: t('hybridEnabled'),
            documentsReady: t('documentsReady'),
            enabled: t('enabled'),
            disabled: t('disabled'),
          }}
        />
      </div>
    </>
  );
}
