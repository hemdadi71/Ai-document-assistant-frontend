'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, X } from 'lucide-react';
import { api, getSettings } from '@/lib/api';
import { useAuth } from '@/components/auth/auth-provider';
import { queryKeys } from '@/lib/query-keys';
import { PageHeading } from '@/components/ui/page-heading';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UploadDropzone } from './upload-dropzone';
import { DocumentList } from './document-list';

export function DocumentLibrary() {
  const t = useTranslations('app');
  const client = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const apiConfigured = Boolean(user) || Boolean(getSettings().apiKey);
  const [confirmFile, setConfirmFile] = useState<string | null>(null);
  const [error, setError] = useState('');
  const documents = useQuery({ queryKey: queryKeys.documents, queryFn: api.documents, enabled: !authLoading && apiConfigured, retry: 1 });
  const upload = useMutation({ mutationFn: api.upload, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.documents }), onError: (cause: Error) => setError(cause.message) });
  const remove = useMutation({ mutationFn: api.removeDocument, onSuccess: () => { client.invalidateQueries({ queryKey: queryKeys.documents }); setConfirmFile(null); }, onError: (cause: Error) => setError(cause.message) });
  const chooseFile = (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) { setError(t('pdfOnly')); return; }
    setError(''); upload.mutate(file);
  };
  return <>
    <PageHeading eyebrow="KNOWLEDGE BASE" title={t('library')} description={t('welcomeSub')}/>
    <UploadDropzone onFile={chooseFile} uploading={upload.isPending} uploadLabel={t('upload')} hintLabel={t('uploadHint')} sizeLabel={t('fileSize')} uploadingLabel={t('uploading')}/>
    {error && <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-[#e49a83]/20 bg-[#e49a83]/[.07] p-3 text-xs text-[#eab4a4]"><AlertCircle size={15}/>{error}<button className="ms-auto" onClick={() => setError('')} aria-label="Dismiss"><X size={14}/></button></div>}
    {!apiConfigured && <div className="mb-4 rounded-xl border border-[#e4ad69]/20 bg-[#e4ad69]/[.07] p-3 text-xs text-[#e7c18e]">{t('apiKeyMissingHint')}</div>}
    <DocumentList documents={documents.data?.documents ?? []} loading={documents.isLoading} deleting={remove.isPending} onDelete={setConfirmFile} labels={{ documents: t('documents'), loading: t('loading'), noDocs: t('noDocs'), noDocsSub: t('noDocsSub'), chunks: t('chunks'), ready: t('ready'), delete: t('delete') }}/>
    {confirmFile && <ConfirmDialog title={t('delete')} description={t('confirmDelete')} value={confirmFile} confirmLabel={t('confirm')} cancelLabel={t('cancel')} busy={remove.isPending} onConfirm={() => remove.mutate(confirmFile)} onClose={() => setConfirmFile(null)}/>}
  </>;
}
