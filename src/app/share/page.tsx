'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, AlertCircle, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { importSharedList, isEncodedShareData } from '@/services/share';
import { Button } from '@/components/ui/Button';
import type { GroceryList } from '@/types/grocery';

export default function SharePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRTL } = useTranslation();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [importedList, setImportedList] = useState<GroceryList | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const data = searchParams.get('data');
    
    if (!data) {
      setStatus('error');
      setErrorMessage(t.share.invalidLink || 'Invalid share link');
      return;
    }
    
    if (!isEncodedShareData(data)) {
      setStatus('error');
      setErrorMessage(t.share.invalidLink || 'Invalid share link');
      return;
    }
    
    // Try to import the list
    try {
      const list = importSharedList(data);
      
      if (list) {
        setImportedList(list);
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(t.share.importFailed || 'Failed to import list');
      }
    } catch (error) {
      console.error('Import error:', error);
      setStatus('error');
      setErrorMessage(t.share.importFailed || 'Failed to import list');
    }
  }, [searchParams, t]);

  const handleOpenList = () => {
    if (importedList) {
      router.push(`/list/${importedList.id}`);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {status === 'loading' && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 size={40} className="text-emerald-500 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {t.share.importing || 'Importing list...'}
            </h1>
            <p className="text-[var(--muted-foreground)]">
              {t.share.pleaseWait || 'Please wait'}
            </p>
          </div>
        )}

        {status === 'success' && importedList && (
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {t.share.importSuccess || 'List imported!'}
            </h1>
            <p className="text-[var(--muted-foreground)] mb-2">
              {importedList.name}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mb-8">
              {importedList.items.length} {t.common.items}
            </p>
            
            {/* List preview */}
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4 mb-6 text-start">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart size={18} className="text-emerald-500" />
                <span className="font-semibold text-[var(--foreground)]">
                  {t.share.listPreview || 'Items'}
                </span>
              </div>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {importedList.items.slice(0, 10).map((item, index) => (
                  <li 
                    key={index}
                    className="text-sm text-[var(--muted-foreground)] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                    <span className="text-xs opacity-60">×{item.quantity}</span>
                  </li>
                ))}
                {importedList.items.length > 10 && (
                  <li className="text-sm text-[var(--muted-foreground)] italic">
                    +{importedList.items.length - 10} {t.share.moreItems || 'more items'}
                  </li>
                )}
              </ul>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full" 
                size="lg"
                onClick={handleOpenList}
              >
                {t.share.openList || 'Open List'}
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={handleGoHome}
              >
                {t.share.goHome || 'Go to Home'}
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              {t.share.importError || 'Import Failed'}
            </h1>
            <p className="text-[var(--muted-foreground)] mb-8">
              {errorMessage}
            </p>
            <Button 
              variant="primary" 
              className="w-full"
              onClick={handleGoHome}
            >
              {t.share.goHome || 'Go to Home'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

