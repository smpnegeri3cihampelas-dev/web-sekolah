// =============================================================
// SPENTIC E-LEARNING HIGH-CAPACITY STORAGE ENGINE (INDEXEDDB + SAFE LOCALSTORAGE)
// Resolves browser localStorage 5MB quota limitation for student file/video submissions
// =============================================================

import { AssignmentSubmission } from './elearningData';

const DB_NAME = 'spentic_elearning_db_v2';
const DB_VERSION = 1;
const STORE_FILES = 'submission_files';
const SUBMISSIONS_STORAGE_KEY = 'spentic_elearning_submissions_v1';

// In-memory fallback cache for instantaneous zero-latency access across components
const fileMemoryCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!('indexedDB' in window)) return Promise.resolve(null);

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_FILES)) {
            db.createObjectStore(STORE_FILES, { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('IndexedDB failed to open, using memory cache fallback', req.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB initialization error:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

/**
 * Save student uploaded file/video (Blob, File, or DataURL) safely in IndexedDB
 * Returns a URL string (Object URL or DataURL) that can be immediately rendered or downloaded.
 */
/**
 * Convert a base64 Data URL into a native browser Blob URL.
 * Required for Chromium / Edge which block rendering data:application/pdf in iframes & objects.
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  if (typeof window === 'undefined') return dataUrl;
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;

  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return dataUrl;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const binary = atob(parts[1]);
    const len = binary.length;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8arr[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Failed converting dataUrl to blobUrl:', err);
    return dataUrl;
  }
}

export async function saveSubmissionFile(
  subId: string,
  fileOrUrl: File | Blob | string,
  fileName?: string
): Promise<string> {
  if (typeof window === 'undefined') return '';

  let resolvedUrl = '';

  if (typeof fileOrUrl === 'string') {
    if (fileOrUrl.startsWith('data:application/pdf')) {
      resolvedUrl = dataUrlToBlobUrl(fileOrUrl);
    } else {
      resolvedUrl = fileOrUrl;
    }
    fileMemoryCache.set(subId, resolvedUrl);
  } else {
    // Generate an instant Object URL for immediate zero-lag playback/viewing
    resolvedUrl = URL.createObjectURL(fileOrUrl);
    fileMemoryCache.set(subId, resolvedUrl);
  }

  try {
    const db = await getDB();
    if (db) {
      const tx = db.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);

      // If it's a File or Blob, convert to DataURL or store Blob directly
      if (typeof fileOrUrl === 'string') {
        store.put({
          id: subId,
          fileName: fileName || 'file_tugas',
          dataUrl: fileOrUrl,
          updatedAt: Date.now()
        });
      } else {
        // Read file into DataURL for persistent storage in IndexedDB
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          try {
            const innerTx = db.transaction(STORE_FILES, 'readwrite');
            const fileNameToStore = fileName || (fileOrUrl instanceof File ? fileOrUrl.name : 'file_tugas');
            innerTx.objectStore(STORE_FILES).put({
              id: subId,
              fileName: fileNameToStore,
              dataUrl,
              updatedAt: Date.now()
            });
          } catch (innerErr) {
            console.warn('Failed storing blob in IndexedDB:', innerErr);
          }
        };
        reader.readAsDataURL(fileOrUrl);
      }
    }
  } catch (e) {
    console.warn('Error saving file to IndexedDB:', e);
  }

  return resolvedUrl;
}

/**
 * Retrieve student submission file/video data URL from Memory Cache or IndexedDB
 */
export async function getSubmissionFile(subId: string): Promise<string | null> {
  // 1. Check in-memory cache first (instant)
  if (fileMemoryCache.has(subId)) {
    return fileMemoryCache.get(subId) || null;
  }

  if (typeof window === 'undefined') return null;

  // 2. Look up in IndexedDB
  try {
    const db = await getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const req = store.get(subId);

      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          const raw = req.result.dataUrl;
          // Convert data URLs for PDF into standard Blob URLs so Chrome/Edge can preview them without security block
          const resolved = (typeof raw === 'string' && (raw.startsWith('data:application/pdf') || raw.startsWith('data:application/octet-stream') || req.result.fileName?.endsWith('.pdf')))
            ? dataUrlToBlobUrl(raw)
            : raw;
          fileMemoryCache.set(subId, resolved);
          resolve(resolved);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('Error fetching file from IndexedDB:', e);
    return null;
  }
}

/**
 * Save submissions safely into localStorage WITHOUT giant base64 payloads
 * Prevents QuotaExceededError completely while preserving all metadata.
 */
export function safeSaveSubmissions(submissions: AssignmentSubmission[]): void {
  if (typeof window === 'undefined') return;

  // Clean payload: Remove huge base64 strings and blob URLs that fail to serialize
  const cleanList = submissions.map(sub => {
    const isLargeDataUrl = sub.fileData && sub.fileData.startsWith('data:') && sub.fileData.length > 50000;
    const isBlobUrl = sub.fileData && sub.fileData.startsWith('blob:');

    // Keep memory cache warm
    if (sub.fileData) {
      fileMemoryCache.set(sub.id, sub.fileData);
    }

    return {
      ...sub,
      // If large base64 or ephemeral blob, omit from localStorage (it is already in IndexedDB/Memory)
      fileData: (isLargeDataUrl || isBlobUrl) ? undefined : sub.fileData,
      hasAttachment: !!(sub.fileData || sub.fileName || sub.videoUrl)
    };
  });

  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(cleanList));
    window.dispatchEvent(new Event('elearningSubmissionsUpdated'));
  } catch (e) {
    console.warn('Quota warning on localStorage. Stripping all fileData to protect metadata.', e);
    try {
      const strippedList = cleanList.map(({ fileData, ...rest }) => rest);
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(strippedList));
      window.dispatchEvent(new Event('elearningSubmissionsUpdated'));
    } catch (criticalErr) {
      console.error('Critical storage error:', criticalErr);
    }
  }
}
