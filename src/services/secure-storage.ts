import { encryptData, decryptData, isEncryptionSupported, clearEncryptionKeys } from '@/lib/encryption';
import {
  getEncryptedApiKey,
  saveEncryptedApiKey,
  removeEncryptedApiKey,
  updateSettings,
  getPreferredModel,
  savePreferredModel,
} from './storage';
import { listGenerativeModels, chooseDefaultModel, type GeminiModel } from './gemini-models';

export interface SecureStorageService {
  storeApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  hasApiKey(): Promise<boolean>;
  clearApiKey(): Promise<void>;
}

// Store API key securely
export async function storeApiKey(apiKey: string): Promise<void> {
  if (!isEncryptionSupported()) {
    throw new Error('Encryption is not supported in this browser');
  }
  
  // Validate API key format (basic validation)
  if (!apiKey || apiKey.trim().length < 10) {
    throw new Error('Invalid API key');
  }
  
  const encrypted = await encryptData(apiKey.trim());
  saveEncryptedApiKey(encrypted);
}

// Retrieve API key
export async function getApiKey(): Promise<string | null> {
  if (!isEncryptionSupported()) {
    return null;
  }
  
  const encrypted = getEncryptedApiKey();
  if (!encrypted) {
    return null;
  }
  
  try {
    return await decryptData(encrypted);
  } catch (error) {
    console.error('Error decrypting API key:', error);
    // If decryption fails, the key is corrupted - remove it
    removeEncryptedApiKey();
    return null;
  }
}

// Check if API key exists
export async function hasApiKey(): Promise<boolean> {
  const encrypted = getEncryptedApiKey();
  return encrypted !== null;
}

// Remove API key
export async function clearApiKey(): Promise<void> {
  removeEncryptedApiKey();
  updateSettings({ hasApiKey: false, aiEnabled: false });
}

// Clear all secure storage (including encryption keys)
export async function clearAllSecureStorage(): Promise<void> {
  await clearApiKey();
  await clearEncryptionKeys();
}

// Validate an API key by asking which models it may use. That is a single
// cheap request, it proves the key works, and it tells us what to run - the
// old version guessed from a hardcoded list of model names and kept whichever
// answered first, which silently pinned users to ageing models.
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const models = await listGenerativeModels(apiKey);
    
    if (models.length === 0) {
      console.error('API key is valid but exposes no usable models');
      return false;
    }
    
    // Keep the user's choice if it still exists, otherwise pick the best one
    const current = getPreferredModel();
    if (!current || !models.some(model => model.id === current)) {
      const best = chooseDefaultModel(models);
      if (best) savePreferredModel(best);
    }
    
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
}

// The models this key can use, best suited first
export async function getAvailableModels(): Promise<GeminiModel[]> {
  const apiKey = await getApiKey();
  if (!apiKey) return [];
  
  return listGenerativeModels(apiKey);
}
