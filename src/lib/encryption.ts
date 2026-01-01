import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'grocery-secure-storage';
const STORE_NAME = 'encryption-keys';
const KEY_ID = 'api-key-encryption-key';

// Get or create the IndexedDB database
async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

// Generate a new AES-GCM encryption key
async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable - needed for storage
    ['encrypt', 'decrypt']
  );
}

// Export key to raw format for storage
async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

// Import key from raw format
async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

// Get or create the encryption key (stored in IndexedDB)
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  const db = await getDB();
  
  // Try to get existing key
  const existingKeyData = await db.get(STORE_NAME, KEY_ID);
  
  if (existingKeyData) {
    return importKey(existingKeyData);
  }
  
  // Generate new key
  const newKey = await generateEncryptionKey();
  const exportedKey = await exportKey(newKey);
  
  // Store in IndexedDB
  await db.put(STORE_NAME, exportedKey, KEY_ID);
  
  return newKey;
}

// Encrypt data using AES-GCM
export async function encryptData(plaintext: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  
  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    plaintextBytes
  );
  
  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  // Convert to base64 for storage
  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

// Decrypt data using AES-GCM
export async function decryptData(encryptedData: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  
  // Decode from base64
  const combined = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map(c => c.charCodeAt(0))
  );
  
  // Extract IV and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  // Decrypt
  const plaintextBytes = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );
  
  // Decode to string
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}

// Clear all encryption keys (for data reset)
export async function clearEncryptionKeys(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, KEY_ID);
}

// Check if Web Crypto API is available
export function isEncryptionSupported(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.encrypt === 'function'
  );
}

