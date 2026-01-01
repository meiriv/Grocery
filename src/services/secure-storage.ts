import { encryptData, decryptData, isEncryptionSupported, clearEncryptionKeys } from '@/lib/encryption';
import { getEncryptedApiKey, saveEncryptedApiKey, removeEncryptedApiKey, updateSettings } from './storage';

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

// Validate API key with Gemini API
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try multiple model names in order of preference
    const modelNames = [
      'gemini-3-flash-preview',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-001',
      'gemini-pro',
    ];
    
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Make a simple request to validate the key
        const result = await model.generateContent('Say "ok" if you can read this.');
        const response = result.response;
        const text = response.text();
        
        if (text.length > 0) {
          // Store the working model name for future use
          if (typeof window !== 'undefined') {
            localStorage.setItem('gemini-model-name', modelName);
          }
          return true;
        }
      } catch (modelError) {
        // Try next model
        console.log(`Model ${modelName} not available, trying next...`);
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
}

