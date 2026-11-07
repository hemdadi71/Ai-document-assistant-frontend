'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface ApiSettingsFormProps {
  initialApiKey: string;
  onSave: (apiKey: string) => Promise<void>;
  saving: boolean;
  labels: {
    apiKey: string;
    securityNote: string;
    save: string;
    apiKeyLength: string;
  };
}

interface SettingsFormValues {
  apiKey: string;
}

export function ApiSettingsForm({
  initialApiKey,
  onSave,
  saving,
  labels,
}: ApiSettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    mode: 'onBlur',
    defaultValues: { apiKey: initialApiKey },
  });

  useEffect(() => {
    reset({ apiKey: initialApiKey });
  }, [initialApiKey, reset]);

  return (
    <form
      noValidate
      onSubmit={handleSubmit(values => onSave(values.apiKey.trim()))}
      className="space-y-4"
    >
      <label className="block">
        <span className="mb-2 block text-xs text-[#9ba7bd]">
          {labels.apiKey}
        </span>
        <input
          type="password"
          autoComplete="off"
          placeholder="Optional legacy project key"
          aria-invalid={Boolean(errors.apiKey)}
          className="w-full rounded-xl border border-white/10 bg-[#080e19] px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#9183f4]/60"
          {...register('apiKey', {
            validate: value =>
              !value.trim() ||
              value.trim().length >= 32 ||
              labels.apiKeyLength,
          })}
        />
        {errors.apiKey && (
          <span role="alert" className="mt-1.5 block text-[11px] text-[#ef9e9e]">
            {errors.apiKey.message}
          </span>
        )}
      </label>

      <p className="text-[10px] leading-5 text-[#758199]">
        {labels.securityNote}
      </p>

      <button
        type="submit"
        disabled={saving || isSubmitting}
        className="rounded-xl bg-gradient-to-r from-[#8274ec] to-[#5b9dbd] px-5 py-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {labels.save}
      </button>
    </form>
  );
}
