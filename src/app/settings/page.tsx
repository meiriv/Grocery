'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { Globe, Moon, Sun, Monitor, Sparkles, Key, ExternalLink, Trash2, Check, AlertTriangle, Cpu, Plug, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useSettings, useTheme, useAISettings } from '@/hooks/useSettings';
import {
  storeApiKey,
  clearApiKey,
  validateApiKey,
  hasApiKey,
  clearAllSecureStorage,
  getAvailableModels,
} from '@/services/secure-storage';
import { getPreferredModel, savePreferredModel } from '@/services/storage';
import type { GeminiModel } from '@/services/gemini-models';
import { testAIConnection, type AIConnectionTest } from '@/services/gemini-client';
import { clearAllData } from '@/services/storage';
import { BottomNav } from '@/components/BottomNav';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { APP_VERSION } from '@/lib/version';

export default function SettingsPage() {
  const { t, interpolate } = useTranslation();
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
  const [model, setModel] = useState<string | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [modelsState, setModelsState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [aiTest, setAiTest] = useState<AIConnectionTest | null>(null);

  // Check if API key exists
  useEffect(() => {
    hasApiKey().then(setHasStoredKey);
    setModel(getPreferredModel());
  }, []);

  // Ask the key which models it can use. Kept out of the initial page load -
  // it only runs when the picker is opened.
  const loadModels = useCallback(async () => {
    setModelsState('loading');
    try {
      const available = await getAvailableModels();
      setModels(available);
      setModelsState('idle');
    } catch (error) {
      console.error('Could not list models:', error);
      setModelsState('error');
    }
  }, []);

  const handleOpenModelPicker = () => {
    setShowModelModal(true);
    void loadModels();
  };

  const handleSelectModel = (id: string) => {
    savePreferredModel(id);
    setModel(id);
    setShowModelModal(false);
    setAiTest(null); // a different model has to prove itself again
  };

  const handleTestAI = async () => {
    setIsTestingAI(true);
    setAiTest(null);
    setAiTest(await testAIConnection());
    setIsTestingAI(false);
  };

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
        setModel(getPreferredModel());
        // A verified key means the user wants AI categorization - switch it on
        // instead of leaving them with a stored key that does nothing.
        updateSettings({ hasApiKey: true, aiEnabled: true });
        
        setTimeout(() => {
          setShowApiKeyModal(false);
          setApiKeyInput('');
          setKeyTestResult(null);
        }, 1500);
      } else {
        setKeyTestResult('error');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
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

  const handleClearAllData = async () => {
    // Also drop the encryption key in IndexedDB, otherwise "clear all data"
    // leaves secrets behind
    try {
      await clearAllSecureStorage();
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
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
        {/* Safe area spacer for iPhone notch/dynamic island */}
        <div className="h-[calc(env(safe-area-inset-top,0px)+12px)]" />
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
                    {aiEnabled && hasStoredKey
                      ? t.settings.aiDescription
                      : hasStoredKey
                      ? t.settings.aiDisabled
                      : t.settings.aiDisabled}
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
              
              {hasStoredKey && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--secondary)] rounded-lg">
                  <Cpu size={16} className="text-[var(--muted-foreground)] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {model || t.settings.model}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t.settings.modelHint}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleOpenModelPicker}>
                    {t.settings.changeModel}
                  </Button>
                </div>
              )}

              {hasStoredKey && (
                <div className="px-3 py-2 bg-[var(--secondary)] rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Plug size={16} className="text-[var(--muted-foreground)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {t.settings.aiStatus}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {t.settings.aiStatusHint}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleTestAI()}
                      isLoading={isTestingAI}
                    >
                      {isTestingAI ? t.settings.testing : t.settings.testAI}
                    </Button>
                  </div>

                  {aiTest && (
                    <div
                      className={cn(
                        'flex items-start gap-2 text-sm',
                        aiTest.ok ? 'text-emerald-500' : 'text-red-500'
                      )}
                    >
                      {aiTest.ok ? (
                        <Check size={16} className="flex-shrink-0 mt-0.5" />
                      ) : (
                        <X size={16} className="flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p>
                          {aiTest.ok
                            ? interpolate(t.settings.testPassed, { ms: aiTest.durationMs })
                            : aiTest.error}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)] break-all">
                          {aiTest.model}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
              <h3 className="font-semibold text-red-500">{t.settings.dangerZone}</h3>
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

      {/* Model Picker */}
      <Modal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        title={t.settings.chooseModel}
      >
        <div className="space-y-3">
          {modelsState === 'loading' && (
            <div className="flex items-center gap-3 py-6 text-[var(--muted-foreground)]">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">{t.settings.loadingModels}</span>
            </div>
          )}

          {modelsState === 'error' && (
            <div className="space-y-3 py-4">
              <p className="text-sm text-red-500">{t.settings.modelsFailed}</p>
              <Button variant="secondary" className="w-full" onClick={() => void loadModels()}>
                {t.settings.retry}
              </Button>
            </div>
          )}

          {modelsState === 'idle' && models.length === 0 && (
            <p className="py-6 text-sm text-[var(--muted-foreground)]">
              {t.settings.noModels}
            </p>
          )}

          {modelsState === 'idle' && models.length > 0 && (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {models.map((option, index) => {
                const isSelected = option.id === model;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectModel(option.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl text-start',
                      'border transition-colors',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-[var(--border)] hover:bg-[var(--accent)]'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--foreground)] break-all">
                          {option.id}
                        </span>
                        {index === 0 && (
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                            {t.settings.recommended}
                          </span>
                        )}
                      </div>
                      {option.displayName !== option.id && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 truncate">
                          {option.displayName}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
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
        onConfirm={() => void handleClearAllData()}
        title={t.settings.clearData}
        message={t.settings.clearDataConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
      />
    </div>
  );
}

