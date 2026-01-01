'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Moon, Sun, Monitor, Sparkles, Key, ExternalLink, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings, useTheme, useAISettings } from '@/hooks/useSettings';
import { storeApiKey, clearApiKey, validateApiKey, hasApiKey } from '@/services/secure-storage';
import { clearAllData } from '@/services/storage';
import { BottomNav } from '@/components/BottomNav';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { APP_VERSION } from '@/lib/version';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme, isDark } = useTheme();
  const { aiEnabled, hasApiKey: hasKey, setAIEnabled } = useAISettings();
  const { settings, updateSettings } = useSettings();

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestResult, setKeyTestResult] = useState<'success' | 'error' | null>(null);
  const [showClearDataConfirm, setShowClearDataConfirm] = useState(false);
  const [showRemoveKeyConfirm, setShowRemoveKeyConfirm] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  // Check if API key exists
  useEffect(() => {
    hasApiKey().then(setHasStoredKey);
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;

    setIsTestingKey(true);
    setKeyTestResult(null);

    try {
      const isValid = await validateApiKey(apiKeyInput.trim());
      
      if (isValid) {
        await storeApiKey(apiKeyInput.trim());
        setKeyTestResult('success');
        setHasStoredKey(true);
        updateSettings({ hasApiKey: true });
        
        setTimeout(() => {
          setShowApiKeyModal(false);
          setApiKeyInput('');
          setKeyTestResult(null);
        }, 1500);
      } else {
        setKeyTestResult('error');
      }
    } catch (error) {
      setKeyTestResult('error');
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    await clearApiKey();
    setHasStoredKey(false);
    setAIEnabled(false);
    setShowRemoveKeyConfirm(false);
  };

  const handleClearAllData = () => {
    clearAllData();
    window.location.reload();
  };

  const handleAIToggle = (enabled: boolean) => {
    if (enabled && !hasStoredKey) {
      setShowApiKeyModal(true);
    } else {
      setAIEnabled(enabled);
    }
  };

  const themeOptions = [
    { value: 'dark', label: t.settings.themeDark, icon: <Moon size={18} /> },
    { value: 'light', label: t.settings.themeLight, icon: <Sun size={18} /> },
    { value: 'system', label: t.settings.themeSystem, icon: <Monitor size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {t.settings.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 pb-safe">
        <div className="py-4 space-y-6">
          {/* Language */}
          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <Globe size={20} className="text-violet-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {t.settings.language}
                  </h3>
                </div>
              </div>
              <LanguageSwitcher variant="inline" />
            </div>
          </section>

          {/* Theme */}
          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                {isDark ? <Moon size={20} className="text-amber-500" /> : <Sun size={20} className="text-amber-500" />}
              </div>
              <h3 className="font-semibold text-[var(--foreground)]">
                {t.settings.theme}
              </h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as typeof theme)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl transition-colors',
                    theme === option.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]'
                  )}
                >
                  {option.icon}
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* AI Categorization */}
          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--foreground)]">
                    {t.settings.aiCategorization}
                  </h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {hasStoredKey ? t.settings.apiKeySet : t.settings.aiDisabled}
                  </p>
                </div>
              </div>
              <Toggle
                checked={aiEnabled && hasStoredKey}
                onChange={handleAIToggle}
                disabled={!hasStoredKey && !aiEnabled}
              />
            </div>

            {/* API Key management */}
            <div className="space-y-2">
              {hasStoredKey ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg">
                    <Check size={16} className="text-emerald-500" />
                    <span className="text-sm text-emerald-500">{t.settings.apiKeySet}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRemoveKeyConfirm(true)}
                    className="text-red-500"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowApiKeyModal(true)}
                  leftIcon={<Key size={18} />}
                >
                  {t.settings.enterApiKey}
                </Button>
              )}
              
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <ExternalLink size={14} />
                {t.settings.getApiKey}
              </a>
            </div>
          </section>

          {/* About */}
          <section className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4">
            <h3 className="font-semibold text-[var(--foreground)] mb-3">
              {t.settings.about}
            </h3>
            <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <div className="flex justify-between">
                <span>{t.settings.version}</span>
                <span>v{APP_VERSION}</span>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/10 rounded-2xl border border-red-500/30 p-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="font-semibold text-red-500">Danger Zone</h3>
            </div>
            <Button
              variant="danger"
              className="w-full"
              onClick={() => setShowClearDataConfirm(true)}
              leftIcon={<Trash2 size={18} />}
            >
              {t.settings.clearData}
            </Button>
          </section>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* API Key Modal */}
      <Modal
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setApiKeyInput('');
          setKeyTestResult(null);
        }}
        title={t.settings.apiKey}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            {t.settings.aiDescription}
          </p>

          <Input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={t.settings.enterApiKey}
            error={keyTestResult === 'error' ? t.settings.testFailed : undefined}
          />

          {keyTestResult === 'success' && (
            <div className="flex items-center gap-2 text-emerald-500">
              <Check size={18} />
              <span>{t.settings.testSuccess}</span>
            </div>
          )}

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-emerald-500 hover:underline"
          >
            <ExternalLink size={14} />
            {t.settings.getApiKey}
          </a>

          <div className="flex gap-3 mt-6">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowApiKeyModal(false);
                setApiKeyInput('');
                setKeyTestResult(null);
              }}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSaveApiKey}
              isLoading={isTestingKey}
              disabled={!apiKeyInput.trim()}
            >
              {t.settings.testConnection}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove API Key Confirmation */}
      <ConfirmDialog
        isOpen={showRemoveKeyConfirm}
        onClose={() => setShowRemoveKeyConfirm(false)}
        onConfirm={handleRemoveApiKey}
        title={t.settings.removeKey}
        message={t.settings.removeKeyConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />

      {/* Clear Data Confirmation */}
      <ConfirmDialog
        isOpen={showClearDataConfirm}
        onClose={() => setShowClearDataConfirm(false)}
        onConfirm={handleClearAllData}
        title={t.settings.clearData}
        message={t.settings.clearDataConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />
    </div>
  );
}

