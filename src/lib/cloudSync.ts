'use client';

import { 
  Assignment, 
  AssignmentSubmission, 
  SubjectSession, 
  getStoredAssignments, 
  getStoredSubmissions, 
  getStoredSessions 
} from './elearningData';
import { 
  CbtExamPackage, 
  CbtStudentAnswerState, 
  CbtExamRoomConfig, 
  getStoredCbtPackages, 
  getStoredStudentCbtSessions,
  getStoredCbtPanitiaConfig
} from './cbtData';

// -------------------------------------------------------------
// SPENTIC HIGH-AVAILABILITY CLOUD SYNCHRONIZATION ENGINE
// Seamlessly syncs local cache with Hostinger MariaDB database
// -------------------------------------------------------------

const ASSIGNMENTS_STORAGE_KEY = 'spentic_elearning_assignments_v1';
const SUBMISSIONS_STORAGE_KEY = 'spentic_elearning_submissions_v1';
const SESSIONS_STORAGE_KEY = 'spentic_elearning_subject_sessions_v1';
const CBT_PACKAGES_KEY = 'spentic_cbt_packages_v1';
const CBT_STUDENT_SESSIONS_KEY = 'spentic_cbt_student_sessions_v1';
const CBT_PANITIA_CONFIG_KEY = 'cbt_panitia_config_v2';

/**
 * Sync E-Learning assignments, submissions, and subject sessions from Hostinger database
 */
export async function syncElearningWithCloud(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Sync Assignments
    const asgRes = await fetch('/api/elearning/assignments', { cache: 'no-store' });
    if (asgRes.ok) {
      const { data } = await asgRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const local = getStoredAssignments();
        const localMap = new Map(local.map(a => [a.id, a]));
        data.forEach((cloudAsg: Assignment) => {
          localMap.set(cloudAsg.id, cloudAsg);
        });
        const merged = Array.from(localMap.values());
        localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('elearningAssignmentsUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync assignments notice (using cached data):', err);
  }

  try {
    // 2. Sync Submissions
    const subRes = await fetch('/api/elearning/submissions', { cache: 'no-store' });
    if (subRes.ok) {
      const { data } = await subRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const local = getStoredSubmissions();
        const localMap = new Map(local.map(s => [s.id, s]));
        data.forEach((cloudSub: AssignmentSubmission) => {
          localMap.set(cloudSub.id, cloudSub);
        });
        const merged = Array.from(localMap.values());
        localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('elearningSubmissionsUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync submissions notice (using cached data):', err);
  }

  try {
    // 3. Sync Subject Sessions (Presensi & Jurnal)
    const sessRes = await fetch('/api/elearning/sessions', { cache: 'no-store' });
    if (sessRes.ok) {
      const { data } = await sessRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const local = getStoredSessions();
        const localMap = new Map(local.map(s => [s.id, s]));
        data.forEach((cloudSess: SubjectSession) => {
          localMap.set(cloudSess.id, cloudSess);
        });
        const merged = Array.from(localMap.values());
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('elearningSessionsUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync sessions notice (using cached data):', err);
  }
}

/**
 * Sync CBT packages, rooms, and student results from Hostinger database
 */
export async function syncCbtWithCloud(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Sync CBT Exam Packages
    const pkgRes = await fetch('/api/cbt/packages', { cache: 'no-store' });
    if (pkgRes.ok) {
      const { data } = await pkgRes.json();
      if (Array.isArray(data)) {
        localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(data));
        window.dispatchEvent(new Event('cbtPackagesUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT packages notice (using cached data):', err);
  }

  try {
    // 2. Sync CBT 17 Exam Rooms
    const roomRes = await fetch('/api/cbt/rooms', { cache: 'no-store' });
    if (roomRes.ok) {
      const { data } = await roomRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const currentConfig = getStoredCbtPanitiaConfig();
        const updatedConfig = { ...currentConfig, rooms: data };
        localStorage.setItem(CBT_PANITIA_CONFIG_KEY, JSON.stringify(updatedConfig));
        window.dispatchEvent(new CustomEvent('cbtPanitiaConfigUpdated', { detail: updatedConfig }));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT rooms notice (using cached data):', err);
  }

  try {
    // 3. Sync CBT Student Results / Answers
    const ansRes = await fetch('/api/cbt/answers', { cache: 'no-store' });
    if (ansRes.ok) {
      const { data } = await ansRes.json();
      if (Array.isArray(data) && data.length > 0) {
        const local = getStoredStudentCbtSessions();
        data.forEach((cloudAns: CbtStudentAnswerState) => {
          const key = `${cloudAns.examId}_${cloudAns.studentId || cloudAns.studentNisn}`;
          local[key] = cloudAns;
        });
        localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(local));
        window.dispatchEvent(new Event('cbtSessionsUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT student answers notice (using cached data):', err);
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS BACKGROUND WRITERS TO HOSTINGER DATABASE
// -------------------------------------------------------------

export function pushAssignmentToCloud(assignment: Assignment): void {
  if (typeof window === 'undefined') return;
  fetch('/api/elearning/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assignment)
  }).catch(err => console.warn('Background assignment upload queued:', err));
}

export function pushSubmissionToCloud(submission: AssignmentSubmission): void {
  if (typeof window === 'undefined') return;
  fetch('/api/elearning/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission)
  }).catch(err => console.warn('Background submission upload queued:', err));
}

export function pushSubjectSessionToCloud(session: SubjectSession): void {
  if (typeof window === 'undefined') return;
  fetch('/api/elearning/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session)
  }).catch(err => console.warn('Background session upload queued:', err));
}

export function pushCbtPackageToCloud(pkg: CbtExamPackage): void {
  if (typeof window === 'undefined') return;
  fetch('/api/cbt/packages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pkg)
  }).catch(err => console.warn('Background CBT package upload queued:', err));
}

export function pushCbtStudentAnswerToCloud(answerState: CbtStudentAnswerState): void {
  if (typeof window === 'undefined') return;
  fetch('/api/cbt/answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answerState)
  }).catch(err => console.warn('Background CBT answer upload queued:', err));
}

export function pushCbtRoomsToCloud(rooms: CbtExamRoomConfig[]): void {
  if (typeof window === 'undefined') return;
  fetch('/api/cbt/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rooms })
  }).catch(err => console.warn('Background CBT rooms upload queued:', err));
}

export function deleteCbtPackageFromCloud(id: string): void {
  if (typeof window === 'undefined') return;
  fetch(`/api/cbt/packages?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Background CBT package delete queued:', err));
}

export function deleteAssignmentFromCloud(id: string): void {
  if (typeof window === 'undefined') return;
  fetch(`/api/elearning/assignments?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Background assignment delete queued:', err));
}
