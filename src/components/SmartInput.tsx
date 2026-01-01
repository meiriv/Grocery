'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Sparkles, X, List, Undo2, Redo2 } from 'lucide-react';
import { cn, parseItemList } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { categorizeItemSync } from '@/services/categorizer';
import { CategoryBadge } from './CategoryPicker';
import type { UnitType } from '@/types/grocery';

interface ParsedItem {
  name: string;
  categoryId: string;
  quantity: number;
  unit: UnitType;
}

interface SmartInputProps {
  onAddItem: (item: {
    name: string;
    categoryId?: string;
    quantity?: number;
    unit?: UnitType;
  }) => void;
  onAddMultiple?: (items: ParsedItem[]) => void;
  onClose?: () => void;
  placeholder?: string;
  showCategoryPreview?: boolean;
  autoFocus?: boolean;
}

export function SmartInput({
  onAddItem,
  onAddMultiple,
  onClose,
  placeholder,
  showCategoryPreview = true,
  autoFocus = false,
}: SmartInputProps) {
  const { t, isRTL } = useTranslation();
  const { 
    state: value, 
    setState: setValueWithHistory, 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    reset: resetHistory 
  } = useUndoRedo('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isMultiLine, setIsMultiLine] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayPlaceholder = placeholder || t.list.addItem;
  
  // Simple setValue wrapper for cases where we don't want history
  const setValue = useCallback((newValue: string, skipHistory: boolean = false) => {
    setValueWithHistory(newValue, skipHistory);
  }, [setValueWithHistory]);

  // Parse input and categorize items
  const parseInput = useCallback((input: string) => {
    if (!input.trim()) {
      setParsedItems([]);
      setShowPreview(false);
      return;
    }

    const items = parseItemList(input);
    
    if (items.length === 0) {
      setParsedItems([]);
      setShowPreview(false);
      return;
    }

    const parsed = items.map(itemText => {
      const result = categorizeItemSync(itemText);
      return {
        name: result.parsedName, // Use the cleaned name (without quantity)
        categoryId: result.categoryId,
        quantity: result.quantity,
        unit: result.unit,
      };
    });

    setParsedItems(parsed);
    setShowPreview(items.length > 1 || showCategoryPreview);
    
    // Auto-switch to multi-line mode if multiple items detected
    if (items.length > 1 && !isMultiLine) {
      setIsMultiLine(true);
    }
  }, [showCategoryPreview, isMultiLine]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Check if paste contains new lines - switch to textarea
    if (newValue.includes('\n') && !isMultiLine) {
      setIsMultiLine(true);
    }
    
    parseInput(newValue);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    
    // If pasting multi-line content, switch to textarea mode
    if (pastedText.includes('\n') || pastedText.split(/[,،]/).length > 2) {
      setIsMultiLine(true);
      // Let the paste happen naturally, the onChange will handle parsing
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim()) return;

    if (parsedItems.length > 1 && onAddMultiple) {
      onAddMultiple(parsedItems);
    } else if (parsedItems.length === 1) {
      onAddItem(parsedItems[0]);
    } else {
      // Single item without parsing
      const result = categorizeItemSync(value.trim());
      onAddItem({
        name: value.trim(),
        categoryId: result.categoryId,
        quantity: result.quantity,
        unit: result.unit,
      });
    }

    resetHistory('');
    setParsedItems([]);
    setShowPreview(false);
    setIsMultiLine(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Undo: Ctrl/Cmd + Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (canUndo) {
        undo();
      }
      return;
    }
    
    // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (canRedo) {
        redo();
      }
      return;
    }
    
    // For single-line input, Enter submits
    // For multi-line textarea, Ctrl/Cmd+Enter submits
    if (e.key === 'Enter') {
      if (!isMultiLine || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
    
    // Escape to exit multi-line mode
    if (e.key === 'Escape' && isMultiLine) {
      setIsMultiLine(false);
    }
  };

  const removePreviewItem = (index: number) => {
    const newItems = parsedItems.filter((_, i) => i !== index);
    setParsedItems(newItems);
    
    // Update input value
    const newValue = newItems.map(i => i.name).join(isMultiLine ? '\n' : ', ');
    setValue(newValue, false); // Save to history
    
    if (newItems.length === 0) {
      setShowPreview(false);
      setIsMultiLine(false);
    }
  };

  // Handle undo button click
  const handleUndo = () => {
    if (canUndo) {
      undo();
    }
  };

  // Handle redo button click
  const handleRedo = () => {
    if (canRedo) {
      redo();
    }
  };

  const toggleMultiLine = () => {
    setIsMultiLine(!isMultiLine);
  };

  // Re-parse when value changes (e.g., from undo/redo)
  useEffect(() => {
    parseInput(value);
  }, [value, parseInput]);

  // Auto-resize textarea
  useEffect(() => {
    if (isMultiLine && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value, isMultiLine]);

  // Focus textarea when switching to multi-line
  useEffect(() => {
    if (isMultiLine && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isMultiLine]);

  // Auto-focus on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the element is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        {isMultiLine ? (
          <>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={t.list.pasteListHint || "Paste your list here...\nItems can be separated by new lines or commas"}
              rows={3}
              dir={isRTL ? 'rtl' : 'ltr'}
              className={cn(
                'w-full px-4 py-4 pb-14 rounded-2xl',
                'bg-[var(--input)] border border-[var(--border)]',
                'text-[var(--foreground)] placeholder-[var(--muted-foreground)]',
                'text-base leading-relaxed',
                'transition-all duration-200 resize-none',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                isRTL && 'text-right'
              )}
            />
            {/* Bottom toolbar for multi-line mode */}
            <div className={cn(
              'absolute bottom-2 left-2 right-2 flex items-center justify-between',
              isRTL && 'flex-row-reverse'
            )}>
              {/* Undo/Redo buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className={cn(
                    'w-8 h-8 rounded-lg',
                    'flex items-center justify-center',
                    'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                    'transition-all duration-200',
                    'hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
                    'disabled:opacity-30 disabled:cursor-not-allowed'
                  )}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className={cn(
                    'w-8 h-8 rounded-lg',
                    'flex items-center justify-center',
                    'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                    'transition-all duration-200',
                    'hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
                    'disabled:opacity-30 disabled:cursor-not-allowed'
                  )}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <Redo2 size={16} />
                </button>
                
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) {
                      onClose();
                    } else {
                      setIsMultiLine(false);
                    }
                  }}
                  className={cn(
                    'w-8 h-8 rounded-lg',
                    'flex items-center justify-center',
                    'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                    'transition-all duration-200',
                    'hover:bg-red-500/20 hover:text-red-500'
                  )}
                  title={t.common.close}
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Submit button */}
              <button
                type="submit"
                disabled={!value.trim()}
                className={cn(
                  'h-8 px-4 rounded-lg',
                  'flex items-center justify-center gap-2',
                  'bg-emerald-500 text-white text-sm font-medium',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'hover:bg-emerald-600'
                )}
              >
                <Plus size={16} />
                {t.common.add} {parsedItems.length > 1 && `(${parsedItems.length})`}
              </button>
            </div>
          </>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={displayPlaceholder}
            className={cn(
              'w-full py-4 rounded-2xl',
              'bg-[var(--input)] border border-[var(--border)]',
              'text-[var(--foreground)] placeholder-[var(--muted-foreground)]',
              'text-lg',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
              // RTL: buttons on left, text starts from right
              // LTR: buttons on right, text starts from left
              isRTL ? 'pr-4 pl-28' : 'pl-4 pr-28'
            )}
          />
        )}
        
        {/* Buttons for single-line mode */}
        {!isMultiLine && (
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 flex items-center gap-1',
            isRTL ? 'left-2' : 'right-2'
          )}>
            {/* Toggle multi-line button */}
            <button
              type="button"
              onClick={toggleMultiLine}
              className={cn(
                'w-10 h-10 rounded-xl',
                'flex items-center justify-center',
                'bg-[var(--secondary)] text-[var(--muted-foreground)]',
                'transition-all duration-200',
                'hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
              )}
              title={t.list.addMultiple}
            >
              <List size={20} />
            </button>
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={!value.trim()}
              className={cn(
                'w-10 h-10 rounded-xl',
                'flex items-center justify-center',
                'bg-emerald-500 text-white',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:bg-emerald-600'
              )}
              aria-label={t.common.add}
            >
              <Plus size={24} />
            </button>
          </div>
        )}
      </form>

      {/* Preview of parsed items */}
      {showPreview && parsedItems.length > 0 && (
        <div className="mt-3 p-3 bg-[var(--secondary)] rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-2 text-sm text-[var(--muted-foreground)]">
            <Sparkles size={14} />
            <span>
              {parsedItems.length > 1
                ? `${parsedItems.length} ${t.common.items}`
                : t.list.category}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {parsedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-2 py-1 bg-[var(--card)] rounded-lg"
              >
                <CategoryBadge categoryId={item.categoryId} size="sm" />
                <span className="text-sm text-[var(--foreground)]">{item.name}</span>
                {parsedItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePreviewItem(index)}
                    className="p-0.5 hover:bg-[var(--accent)] rounded"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint for multiple items */}
      {!showPreview && (
        <p className="mt-2 text-xs text-[var(--muted-foreground)] text-center">
          {t.list.addMultiple}
        </p>
      )}
    </div>
  );
}

