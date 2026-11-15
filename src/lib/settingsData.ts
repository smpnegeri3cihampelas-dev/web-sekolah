'use client';

import { useState, useEffect, useCallback } from 'react';
export * from './settingsConstants';
import {
  SchoolIdentity,
  DEFAULT_SCHOOL_IDENTITY
} from './settingsConstants';

const STORAGE_KEY = 'smpn3_school_identity';
const EVENT_NAME = 'smpn3_identity_updated';
const PASS_STORAGE_KEY = 'smpn3_admin_password';

export function getStoredIdentity(): SchoolIdentity {
  if (typeof window === 'undefined') return DEFAULT_SCHOOL_IDENTITY;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL_IDENTITY));
      return DEFAULT_SCHOOL_IDENTITY;
    }
    const parsed = JSON.parse(saved);
    if (parsed && parsed.schoolName) {
      return { ...DEFAULT_SCHOOL_IDENTITY, ...parsed };
    }
    return DEFAULT_SCHOOL_IDENTITY;
  } catch (err) {
    console.error('Error reading school identity from storage', err);
    return DEFAULT_SCHOOL_IDENTITY;
  }
}

export function saveStoredIdentity(identity: Partial<SchoolIdentity>): SchoolIdentity {
  const current = getStoredIdentity();
  const updated: SchoolIdentity = {
    ...current,
    ...identity,
    updatedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_NAME));

      // Asynchronous sync to MariaDB Cloud
      fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_identity', identity: updated })
      }).catch((err) => console.error('Cloud identity sync error:', err));
    } catch (err) {
      console.error('Error saving identity to storage', err);
    }
  }

  return updated;
}

// Full Two-Way Cloud Sync with MariaDB
export async function syncSettingsWithCloud(): Promise<{ identity: SchoolIdentity; hasCustomPassword: boolean }> {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const json = await res.json();

    let fetchedIdentity = DEFAULT_SCHOOL_IDENTITY;
    if (json.success && json.identity) {
      fetchedIdentity = { ...DEFAULT_SCHOOL_IDENTITY, ...json.identity };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedIdentity));
        window.dispatchEvent(new Event(EVENT_NAME));
      }
    }

    return {
      identity: fetchedIdentity,
      hasCustomPassword: Boolean(json.hasCustomPassword)
    };
  } catch (err) {
    console.warn('Sync with cloud settings failed, using local cache:', err);
    return {
      identity: getStoredIdentity(),
      hasCustomPassword: false
    };
  }
}

export async function updateAdminPasswordCloud(password: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PASS_STORAGE_KEY, password);
    } catch {}
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_password', password })
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.error('Error updating admin password to cloud:', err);
    return false;
  }
}

export async function resetAdminPasswordCloud(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(PASS_STORAGE_KEY);
    } catch {}
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_password' })
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.error('Error resetting admin password in cloud:', err);
    return false;
  }
}

export async function resetSchoolIdentityCloud(): Promise<SchoolIdentity> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL_IDENTITY));
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch {}
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_identity' })
    });
    const json = await res.json();
    if (json.success && json.identity) {
      return json.identity;
    }
  } catch (err) {
    console.error('Error resetting identity in cloud:', err);
  }

  return DEFAULT_SCHOOL_IDENTITY;
}

export async function executeMasterResetCloud(): Promise<boolean> {
  // Clear local caches
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCHOOL_IDENTITY));
      localStorage.removeItem(PASS_STORAGE_KEY);
      window.dispatchEvent(new Event(EVENT_NAME));
    } catch {}
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'master_reset' })
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (err) {
    console.error('Error executing master reset in cloud:', err);
    return false;
  }
}

export function useSettingsData() {
  const [identity, setIdentity] = useState<SchoolIdentity>(DEFAULT_SCHOOL_IDENTITY);
  const [hasCustomPassword, setHasCustomPassword] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const refreshFromCloud = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncSettingsWithCloud();
      setIdentity(res.identity);
      setHasCustomPassword(res.hasCustomPassword);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    setIdentity(getStoredIdentity());
    refreshFromCloud();

    const handleUpdate = () => {
      setIdentity(getStoredIdentity());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshFromCloud]);

  return {
    identity,
    hasCustomPassword,
    isSyncing,
    isMounted,
    refreshFromCloud,
    saveIdentity: (data: Partial<SchoolIdentity>) => saveStoredIdentity(data),
    updatePassword: (password: string) => updateAdminPasswordCloud(password),
    resetPassword: () => resetAdminPasswordCloud(),
    resetIdentity: () => resetSchoolIdentityCloud(),
    executeMasterReset: () => executeMasterResetCloud()
  };
}
