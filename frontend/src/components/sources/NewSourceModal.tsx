
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { FileText, Upload, AlertCircle, X } from 'lucide-react';
import { BackendBrandSource } from '../../types';
import { Modal } from '../UI/Modal';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { sourcesService } from '../../services/API/sourcesService';

interface NewSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceCreated: (source: BackendBrandSource) => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'docx'];

export const NewSourceModal: React.FC<NewSourceModalProps> = ({
  isOpen,
  onClose,
  onSourceCreated,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState('guideline_pdf');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSourceType('guideline_pdf');
    setFile(null);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      setError('Unsupported file format. Please select a PDF, TXT or DOCX file.');
      setFile(null);
      event.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size exceeds the 15 MB limit.');
      setFile(null);
      event.target.value = '';
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!name.trim()) {
      setError('Please provide a source name.');
      return;
    }

    if (!file) {
      setError('Please select a document to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('source_type', sourceType);
    formData.append('file', file);

    try {
      setIsSubmitting(true);
      setError(null);

      const createdSource = await sourcesService.createSource(formData);

      onSourceCreated(createdSource);
      resetForm();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload the brand source. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register Brand Source"
      description="Upload an authoritative guideline document. The backend extracts its text and creates a draft source version."
      maxWidth="2xl"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSubmit()}
            isLoading={isSubmitting}
            disabled={!name.trim() || !file || isSubmitting}
          >
            Upload Source
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {error && (
          <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Source Name"
          placeholder="e.g. Global Brand Guidelines 2026"
          value={name}
          onChange={event => setName(event.target.value)}
          required
        />

        <Select
          label="Source Type"
          options={[
            { value: 'guideline_pdf', label: 'Brand Guideline' },
            { value: 'legal', label: 'Legal & Regulatory' },
            { value: 'tone_voice', label: 'Brand Tone & Editorial Voice' },
            { value: 'trademark', label: 'Trademark & Marks' },
            { value: 'security', label: 'Security & Certifications' },
            { value: 'product', label: 'Product Guidelines' },
          ]}
          value={sourceType}
          onChange={event => setSourceType(event.target.value)}
        />

        <div className="space-y-2">
          <label className="text-xs font-medium text-[#CBD5E1]">
            Guideline Document
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={handleFileChange}
            disabled={isSubmitting}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="w-full min-h-[150px] p-5 rounded-xl border border-dashed border-[#334155] bg-[#0D1220] hover:border-[#6366F1] transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50"
          >
            {file ? (
              <>
                <FileText className="w-8 h-8 text-[#818CF8]" />
                <span className="text-sm font-medium text-[#F8FAFC] break-all">
                  {file.name}
                </span>
                <span className="text-xs text-[#94A3B8]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#818CF8]" />
                <span className="text-sm font-medium text-[#F8FAFC]">
                  Click to select a document
                </span>
                <span className="text-xs text-[#94A3B8]">
                  PDF, TXT or DOCX · Maximum 15 MB
                </span>
              </>
            )}
          </button>

          {file && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#EF4444]"
            >
              <X className="w-3.5 h-3.5" />
              Remove selected file
            </button>
          )}
        </div>

        <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1">
          <p className="text-xs font-medium text-[#CBD5E1]">
            What happens after upload?
          </p>
          <p className="text-[11px] text-[#94A3B8] leading-relaxed">
            The backend extracts the document text and creates a draft source
            version. Another authorised organisation member must approve it
            before its passages are indexed.
          </p>
        </div>
      </form>
    </Modal>
  );
};
