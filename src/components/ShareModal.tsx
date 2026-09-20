'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  getShareUrl,
  copyShareLink,
  shareViaWebShare,
  isWebShareAvailable,
} from '@/services/share';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
}

export function ShareModal({ isOpen, onClose, listId, listName }: ShareModalProps) {
  const { t } = useTranslation();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canWebShare, setCanWebShare] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShareUrl(getShareUrl(listId));
      setCanWebShare(isWebShareAvailable());
      setCopied(false);
    }
  }, [isOpen, listId]);

  // Clear the "copied" confirmation without leaking a timer
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    const success = await copyShareLink(listId);
    if (success) {
      setCopied(true);
    }
  };

  const handleWebShare = async () => {
    await shareViaWebShare(listId, listName);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.share.title}>
      <div className="space-y-6">
        {/* Description */}
        <p className="text-sm text-[var(--muted-foreground)]">
          {t.share.description}
        </p>

        {/* Share Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">
            {t.share.copyLink}
          </label>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0 px-3 py-2 bg-[var(--secondary)] rounded-lg text-sm text-[var(--foreground)] truncate">
              {shareUrl || '...'}
            </div>
            <Button
              variant="secondary"
              onClick={handleCopyLink}
              className={cn(
                'min-w-[100px]',
                copied && 'bg-emerald-500/20 text-emerald-500'
              )}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  {t.share.linkCopied}
                </>
              ) : (
                <>
                  <Copy size={16} />
                  {t.common.copy || 'Copy'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Web Share API button (mobile) */}
        {canWebShare && (
          <Button
            variant="primary"
            className="w-full"
            onClick={handleWebShare}
          >
            <Share2 size={18} />
            {t.share.shareVia || 'Share via...'}
          </Button>
        )}

        {/* Close button */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={onClose}
        >
          {t.common.close}
        </Button>
      </div>
    </Modal>
  );
}

