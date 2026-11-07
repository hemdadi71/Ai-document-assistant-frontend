'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import {
  ArrowRight,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { useAuth } from './auth-provider';
import { FormField } from '@/components/ui/form-field';

interface AuthFormValues {
  username: string;
  password: string;
  confirmPassword?: string;
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const {
    signIn,
    registerAccount,
    user,
    loading: authLoading,
  } = useAuth();

  const [apiError, setApiError] = useState('');
  const isRegister = mode === 'register';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-[#080e19] px-4 py-3 text-sm text-white outline-none transition focus:border-[#9183f4]/60';

  const onSubmit = async (values: AuthFormValues) => {
    setApiError('');

    const payload = {
      username: values.username.trim().toLowerCase(),
      password: values.password,
    };

    try {
      if (isRegister) {
        await registerAccount(payload);
      } else {
        await signIn(payload);
      }

      toast.success(
        isRegister ? t('registerLoginSuccess') : t('loginSuccess'),
      );

      router.replace('/dashboard');
      router.refresh();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'UNKNOWN';

      const knownErrors: Record<string, string> = {
        'Username is already registered.': t('usernameExists'),
        'Invalid username or password.': t('invalidCredentials'),
        API_UNREACHABLE: t('apiUnreachable'),
        AUTH_REQUIRED: t('invalidCredentials'),
        SESSION_EXPIRED: t('sessionExpired'),
        HTTP_409: t('usernameExists'),
      };

      setApiError(knownErrors[message] || message);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[#edf0fa]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(119,101,222,.18),_transparent_48%)]" />
      <div className="pointer-events-none absolute -bottom-36 -left-24 size-96 rounded-full bg-[#4d9da9]/[.07] blur-3xl" />

      <div className="relative w-full max-w-md">
        <header className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-[#9284ff]/20 bg-gradient-to-br from-[#8274ec]/20 to-[#5b9dbd]/10 text-[#b7adff]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-base font-semibold tracking-wide">Nexa AI</div>
              <div className="mt-0.5 text-[10px] text-[#758199]">
                {t('brandSubtitle')}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.replace(pathname, {
                locale: locale === 'fa' ? 'en' : 'fa',
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-[#aeb8cb] transition hover:bg-white/5"
          >
            <Globe2 size={14} />
            {locale === 'fa' ? 'EN' : 'فا'}
          </button>
        </header>

        <section className="glass rounded-[28px] border border-white/10 p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8274ec]/20 to-[#5b9dbd]/10 text-[#b7adff]">
            {isRegister ? <UserRound size={21} /> : <LockKeyhole size={21} />}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {isRegister ? t('registerTitle') : t('loginTitle')}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#8793aa]">
            {isRegister ? t('registerDescription') : t('loginDescription')}
          </p>

          {apiError && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-[#e49a83]/20 bg-[#e49a83]/[.08] px-3.5 py-3 text-xs leading-6 text-[#efb6a5]"
            >
              {apiError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-6 space-y-4"
          >
            <FormField
              label={t('username')}
              htmlFor="username"
              hint={t('usernameHint')}
              error={errors.username?.message}
            >
              <input
                id="username"
                autoComplete="username"
                placeholder="demo_user"
                aria-invalid={Boolean(errors.username)}
                className={inputClass}
                {...register('username', {
                  required: t('usernameRequired'),
                  setValueAs: (value: string) => value.trim().toLowerCase(),
                  minLength: {
                    value: 3,
                    message: t('invalidUsername'),
                  },
                  maxLength: {
                    value: 32,
                    message: t('invalidUsername'),
                  },
                  pattern: {
                    value: /^[a-z0-9_.-]{3,32}$/,
                    message: t('invalidUsername'),
                  },
                })}
              />
            </FormField>

            <FormField
              label={t('password')}
              htmlFor="password"
              hint={isRegister ? t('passwordHint') : undefined}
              error={errors.password?.message}
            >
              <input
                id="password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                className={inputClass}
                {...register('password', {
                  required: t('passwordRequired'),
                  minLength: isRegister
                    ? {
                        value: 8,
                        message: t('passwordHint'),
                      }
                    : undefined,
                  maxLength: {
                    value: 128,
                    message: t('passwordHint'),
                  },
                })}
              />
            </FormField>

            {isRegister && (
              <FormField
                label={t('confirmPassword')}
                htmlFor="confirmPassword"
                error={errors.confirmPassword?.message}
              >
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={inputClass}
                  {...register('confirmPassword', {
                    deps: ['password'],
                    required: t('confirmPasswordRequired'),
                    validate: value =>
                      value === getValues('password') ||
                      t('passwordMismatch'),
                  })}
                />
              </FormField>
            )}

            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8274ec] to-[#5b9dbd] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(113,99,220,.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
              {isRegister ? t('registerAction') : t('loginAction')}
            </button>
          </form>

          <div className="mt-6 border-t border-white/[.07] pt-5 text-center text-xs text-[#8995aa]">
            {isRegister ? t('hasAccount') : t('noAccount')}{' '}
            <Link
              href={isRegister ? '/login' : '/register'}
              className="font-semibold text-[#b7adff] hover:text-white"
            >
              {isRegister ? t('loginAction') : t('registerAction')}
            </Link>
          </div>
        </section>

        <p className="mt-5 text-center text-[10px] leading-5 text-[#56627a]">
          {t('securityFooter')}
        </p>
      </div>
    </main>
  );
}
