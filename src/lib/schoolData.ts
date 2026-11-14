'use client';

import { useState, useEffect } from 'react';
import { 
  Leader, 
  Teacher, 
  DataPokok, 
  SchoolData, 
  DEFAULT_LEADERS, 
  DEFAULT_TEACHERS, 
  DEFAULT_DATA_POKOK 
} from './schoolConstants';

export type { Leader, Teacher, DataPokok, SchoolData };
export { DEFAULT_LEADERS, DEFAULT_TEACHERS, DEFAULT_DATA_POKOK };

const STORAGE_KEY = 'smpn3_school_data_v3';
const EVENT_NAME = 'smpn3_school_data_changed';

export function getStoredSchoolData(): SchoolData {
  if (typeof window === 'undefined') {
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: SchoolData = {
        leaders: DEFAULT_LEADERS,
        teachers: DEFAULT_TEACHERS,
        dataPokok: DEFAULT_DATA_POKOK
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      leaders: parsed.leaders && parsed.leaders.length > 0 ? parsed.leaders : DEFAULT_LEADERS,
      teachers: parsed.teachers && parsed.teachers.length > 0 ? parsed.teachers : DEFAULT_TEACHERS,
      dataPokok: parsed.dataPokok || DEFAULT_DATA_POKOK
    };
  } catch (err) {
    console.error('Error reading school data from storage', err);
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK
    };
  }
}

export function saveStoredSchoolData(data: Partial<SchoolData>): SchoolData {
  if (typeof window === 'undefined') {
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK,
      ...data
    };
  }

  try {
    const current = getStoredSchoolData();
    const updated: SchoolData = {
      ...current,
      ...data
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
    return updated;
  } catch (err) {
    console.error('Error saving school data to storage', err);
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK,
      ...data
    };
  }
}

/**
 * Sync school data (leaders, teachers, dataPokok) with MariaDB database.
 */
export async function syncSchoolWithCloud(): Promise<SchoolData> {
  if (typeof window === 'undefined') {
    return { leaders: DEFAULT_LEADERS, teachers: DEFAULT_TEACHERS, dataPokok: DEFAULT_DATA_POKOK };
  }

  try {
    const res = await fetch('/api/school');
    if (!res.ok) return getStoredSchoolData();
    const json = await res.json();
    if (json.success) {
      const synced: SchoolData = {
        leaders: Array.isArray(json.leaders) && json.leaders.length > 0 ? json.leaders : DEFAULT_LEADERS,
        teachers: Array.isArray(json.teachers) && json.teachers.length > 0 ? json.teachers : DEFAULT_TEACHERS,
        dataPokok: json.dataPokok || DEFAULT_DATA_POKOK
      };
      saveStoredSchoolData(synced);
      return synced;
    }
  } catch (e) {
    console.warn('Could not sync school data from cloud API:', e);
  }
  return getStoredSchoolData();
}

export async function saveLeaderCloud(leaderId: number, patch: Partial<Leader>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/school', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'leader', id: leaderId, ...patch })
    });
  } catch (e) {
    console.warn('Background sync leader to cloud failed:', e);
  }
}

export async function addTeacherCloud(newTData: Omit<Teacher, 'id'>): Promise<number | undefined> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/school', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'teacher', teacher: newTData })
    });
    const json = await res.json();
    return json.insertId;
  } catch (e) {
    console.warn('Background sync add teacher to cloud failed:', e);
  }
}

export async function saveTeacherCloud(teacherId: number, patch: Partial<Teacher>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/school', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'teacher', id: teacherId, ...patch })
    });
  } catch (e) {
    console.warn('Background sync teacher to cloud failed:', e);
  }
}

export async function deleteTeacherCloud(teacherId: number): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/school', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'teacher', id: teacherId })
    });
  } catch (e) {
    console.warn('Background sync delete teacher to cloud failed:', e);
  }
}

export async function saveDataPokokCloud(dp: DataPokok): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/school', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'dataPokok', dataPokok: dp })
    });
  } catch (e) {
    console.warn('Background sync dataPokok to cloud failed:', e);
  }
}

export function resetStoredSchoolData(): SchoolData {
  const initialData: SchoolData = {
    leaders: DEFAULT_LEADERS,
    teachers: DEFAULT_TEACHERS,
    dataPokok: DEFAULT_DATA_POKOK
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    window.dispatchEvent(new Event(EVENT_NAME));
    fetch('/api/school', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' })
    }).catch(err => console.warn('Background sync reset school data failed:', err));
  }
  return initialData;
}

export function useSchoolData() {
  const [data, setData] = useState<SchoolData>(() => {
    if (typeof window !== 'undefined') {
      return getStoredSchoolData();
    }
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK
    };
  });

  useEffect(() => {
    // 1. Initial sync from local storage for zero-lag instant display
    setData(getStoredSchoolData());

    // 2. Immediate cloud synchronization from MariaDB
    syncSchoolWithCloud().then(cloudData => {
      if (cloudData) {
        setData(cloudData);
      }
    });

    const handleUpdate = () => {
      setData(getStoredSchoolData());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    leaders: data.leaders,
    teachers: data.teachers,
    dataPokok: data.dataPokok,
    setLeaders: (newLeaders: Leader[]) => saveStoredSchoolData({ leaders: newLeaders }),
    setTeachers: (newTeachers: Teacher[]) => saveStoredSchoolData({ teachers: newTeachers }),
    setDataPokok: (newDataPokok: DataPokok) => {
      saveStoredSchoolData({ dataPokok: newDataPokok });
      saveDataPokokCloud(newDataPokok);
    },
    resetData: () => resetStoredSchoolData(),
    refreshSchoolData: () => syncSchoolWithCloud()
  };
}
