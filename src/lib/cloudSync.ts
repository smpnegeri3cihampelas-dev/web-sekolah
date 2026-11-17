'use client';

import { 
  Assignment, 
  AssignmentSubmission, 
  SubjectSession
} from './elearningData';
import { safeSaveSubmissions } from './elearningStorage';
import { 
  CbtExamPackage, 
  CbtStudentAnswerState, 
  CbtExamRoomConfig, 
  getStoredCbtPackages, 
  getStoredStudentCbtSessions,
  getStoredCbtPanitiaConfig,
  isViolationSyncPending,
  isRoomsCloudSyncSafeToApply,
  isRoomsUploadPending,
  getLastRoomsForceEmpty,
  toLocalDateString
} from './cbtData';

// -------------------------------------------------------------
// SPENTIC HIGH-AVAILABILITY CLOUD SYNCHRONIZATION ENGINE
// Seamlessly syncs local cache with Hostinger MariaDB database
// -------------------------------------------------------------

const ASSIGNMENTS_STORAGE_KEY = 'spentic_elearning_assignments_v1';
const SESSIONS_STORAGE_KEY = 'spentic_elearning_subject_sessions_v1';
const CBT_PACKAGES_KEY = 'spentic_cbt_packages_v1';
const CBT_STUDENT_SESSIONS_KEY = 'spentic_cbt_student_sessions_v1';
const CBT_PANITIA_CONFIG_KEY = 'cbt_panitia_config_v2';
const DELETED_ASG_KEY = 'spentic_deleted_asg_ids_v1';
const PENDING_ASG_UPLOADS_KEY = 'spentic_pending_asg_uploads_v1';
const PENDING_SUB_UPLOADS_KEY = 'spentic_pending_sub_uploads_v1';

// Tombstone tracking for deleted assignments
export function getDeletedAssignmentIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_ASG_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function recordDeletedAssignmentId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedAssignmentIds();
    current.add(id);
    localStorage.setItem(DELETED_ASG_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

export function unmarkDeletedAssignmentId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedAssignmentIds();
    if (current.has(id)) {
      current.delete(id);
      localStorage.setItem(DELETED_ASG_KEY, JSON.stringify(Array.from(current)));
    }
  } catch {}
}

export function queuePendingAssignmentUpload(assignment: Assignment): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_ASG_UPLOADS_KEY);
    const list: Assignment[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(a => a.id === assignment.id);
    if (idx >= 0) list[idx] = assignment;
    else list.push(assignment);
    localStorage.setItem(PENDING_ASG_UPLOADS_KEY, JSON.stringify(list));
  } catch {}
}

export function dequeuePendingAssignmentUpload(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_ASG_UPLOADS_KEY);
    if (!raw) return;
    const list: Assignment[] = JSON.parse(raw);
    const filtered = list.filter(a => a.id !== id);
    localStorage.setItem(PENDING_ASG_UPLOADS_KEY, JSON.stringify(filtered));
  } catch {}
}

export function queuePendingSubmissionUpload(submission: AssignmentSubmission): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_SUB_UPLOADS_KEY);
    const list: AssignmentSubmission[] = raw ? JSON.parse(raw) : [];
    const safeFileData =
      submission.fileData && (submission.fileData.startsWith('blob:') || submission.fileData.length > 50000)
        ? undefined
        : submission.fileData;
    const safeSub: AssignmentSubmission = { ...submission, fileData: safeFileData };
    const idx = list.findIndex(s => s.id === safeSub.id);
    if (idx >= 0) list[idx] = safeSub;
    else list.push(safeSub);
    localStorage.setItem(PENDING_SUB_UPLOADS_KEY, JSON.stringify(list));
  } catch {}
}

export function dequeuePendingSubmissionUpload(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_SUB_UPLOADS_KEY);
    if (!raw) return;
    const list: AssignmentSubmission[] = JSON.parse(raw);
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem(PENDING_SUB_UPLOADS_KEY, JSON.stringify(filtered));
  } catch {}
}

/**
 * Sync E-Learning assignments, submissions, and subject sessions from Hostinger database
 */
export async function syncElearningWithCloud(): Promise<void> {
  if (typeof window === 'undefined') return;

  const deletedIds = getDeletedAssignmentIds();

  try {
    // 1. Sync Assignments: Database MariaDB is Single Source of Truth
    const asgRes = await fetch('/api/elearning/assignments', { cache: 'no-store' });
    if (asgRes.ok) {
      const { data } = await asgRes.json();
      if (Array.isArray(data)) {
        // If cloud still has an assignment that was explicitly deleted, delete from cloud
        data.forEach((cloudAsg: Assignment) => {
          if (deletedIds.has(cloudAsg.id)) {
            deleteAssignmentFromCloud(cloudAsg.id);
          }
        });

        const asgMap = new Map<string, Assignment>();
        data
          .filter((c: Assignment) => !deletedIds.has(c.id))
          .forEach((c: Assignment) => asgMap.set(c.id, c));

        // Overlay & retry any queued/in-flight teacher assignments so newly published tasks are never overwritten
        try {
          const rawPending = localStorage.getItem(PENDING_ASG_UPLOADS_KEY);
          if (rawPending) {
            const pendingList: Assignment[] = JSON.parse(rawPending);
            for (const pendingAsg of pendingList) {
              if (!deletedIds.has(pendingAsg.id)) {
                asgMap.set(pendingAsg.id, pendingAsg);
                const ok = await pushAssignmentToCloud(pendingAsg);
                if (ok) dequeuePendingAssignmentUpload(pendingAsg.id);
              }
            }
          }
        } catch {}

        const authoritativeAssignments = Array.from(asgMap.values());
        localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(authoritativeAssignments));
        window.dispatchEvent(new Event('elearningAssignmentsUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync assignments notice (using cached data):', err);
  }

  try {
    // 2. Sync Submissions: Database MariaDB is Single Source of Truth + Safe Pending Queue
    const subRes = await fetch('/api/elearning/submissions', { cache: 'no-store' });
    if (subRes.ok) {
      const { data } = await subRes.json();
      if (Array.isArray(data)) {
        const subMap = new Map<string, AssignmentSubmission>();
        data.forEach((cloudSub: AssignmentSubmission) => {
          if (!deletedIds.has(cloudSub.assignmentId)) {
            subMap.set(cloudSub.id, cloudSub);
          }
        });

        // Overlay & retry any pending/in-flight student submissions or teacher grades
        try {
          const rawPendingSubs = localStorage.getItem(PENDING_SUB_UPLOADS_KEY);
          if (rawPendingSubs) {
            const pendingSubs: AssignmentSubmission[] = JSON.parse(rawPendingSubs);
            for (const pSub of pendingSubs) {
              if (!deletedIds.has(pSub.assignmentId)) {
                subMap.set(pSub.id, pSub);
                await pushSubmissionToCloud(pSub);
              }
            }
          }
        } catch {}

        const authoritativeSubmissions = Array.from(subMap.values());
        safeSaveSubmissions(authoritativeSubmissions);
      }
    }
  } catch (err) {
    console.warn('Cloud sync submissions notice (using cached data):', err);
  }

  try {
    // 3. Sync Subject Sessions (Presensi & Jurnal): Database MariaDB is Single Source of Truth
    const sessRes = await fetch('/api/elearning/sessions', { cache: 'no-store' });
    if (sessRes.ok) {
      const { data } = await sessRes.json();
      if (Array.isArray(data)) {
        const cloudMap = new Map<string, SubjectSession>();
        data.forEach((cloudSess: SubjectSession) => {
          cloudMap.set(cloudSess.id, cloudSess);
        });

        // Flush any pending local session uploads not yet confirmed in cloud
        try {
          const rawPendingSess = localStorage.getItem('spentic_pending_sess_uploads_v1');
          if (rawPendingSess) {
            const pendingList: SubjectSession[] = JSON.parse(rawPendingSess);
            for (const pSess of pendingList) {
              cloudMap.set(pSess.id, pSess);
              pushSubjectSessionToCloud(pSess);
            }
          }
        } catch {}

        const authoritativeSessions = Array.from(cloudMap.values());
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(authoritativeSessions));
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
        const cleaned = data
          .filter((p: any) => {
            const tName = p.teacherName || '';
            return !tName.includes('Cucu Rohaeti') && !tName.includes('Erma Rismayanti');
          })
          .map((p: any) => ({
            ...p,
            examDate: toLocalDateString(p.examDate)
          }));
        localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(cleaned));
        window.dispatchEvent(new Event('cbtPackagesUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT packages notice (using cached data):', err);
  }

  try {
    // 2. Sync CBT 17 Exam Rooms (Lindungi perubahan Panitia lokal yang baru dibuat atau masih tertunda)
    if (!isRoomsCloudSyncSafeToApply()) {
      if (isRoomsUploadPending()) {
        const localCfg = getStoredCbtPanitiaConfig();
        await pushCbtRoomsToCloud(localCfg.rooms, { forceEmpty: getLastRoomsForceEmpty() });
      }
    } else {
      const roomRes = await fetch('/api/cbt/rooms', { cache: 'no-store' });
      if (roomRes.ok) {
        const { data } = await roomRes.json();
        if (Array.isArray(data) && data.length > 0 && isRoomsCloudSyncSafeToApply()) {
          const currentConfig = getStoredCbtPanitiaConfig();
          const updatedConfig = { ...currentConfig, rooms: data };
          localStorage.setItem(CBT_PANITIA_CONFIG_KEY, JSON.stringify(updatedConfig));
          window.dispatchEvent(new CustomEvent('cbtPanitiaConfigUpdated', { detail: updatedConfig }));
        }
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT rooms notice (using cached data):', err);
  }

  try {
    // 3. Sync CBT Student Results / Answers (Race-Safe & Violation-Safe Merge)
    const ansRes = await fetch('/api/cbt/answers', { cache: 'no-store' });
    if (ansRes.ok) {
      const { data } = await ansRes.json();
      if (Array.isArray(data)) {
        const local = getStoredStudentCbtSessions();
        const matchedLocalKeys = new Set<string>();

        data.forEach((cloudAns: CbtStudentAnswerState) => {
          const defaultKey = `${cloudAns.examId}_${cloudAns.studentId || cloudAns.studentNisn}`;
          const matchedKey = local[defaultKey]
            ? defaultKey
            : Object.keys(local).find(k => {
                const s = local[k];
                return s.examId === cloudAns.examId && (
                  s.studentId === cloudAns.studentId ||
                  (cloudAns.studentNisn && (s.studentNisn === cloudAns.studentNisn || s.studentId === cloudAns.studentNisn))
                );
              }) || defaultKey;
          matchedLocalKeys.add(matchedKey);

          const existingLocal = local[matchedKey];
          if (!existingLocal) {
            local[matchedKey] = {
              ...cloudAns,
              violationSynced: Number(cloudAns.violationCount || 0) >= 1
            };
            return;
          }

          const localLocked = Number(existingLocal.violationCount || 0) >= 1;
          const cloudLocked = Number(cloudAns.violationCount || 0) >= 1;
          const hasPending = isViolationSyncPending(
            existingLocal.examId,
            existingLocal.studentId,
            existingLocal.studentNisn
          );

          // 1. Lindungi status TERKUNCI lokal agar tidak tertimpa data server yang belum tersinkron (race condition)
          if (localLocked && !cloudLocked) {
            const cloudIsGenuineUnlock =
              (cloudAns.unlockedAt && existingLocal.lockedAt && Number(cloudAns.unlockedAt) >= Number(existingLocal.lockedAt)) ||
              (existingLocal.violationSynced === true && !hasPending);

            if (!cloudIsGenuineUnlock) {
              if (!hasPending && !existingLocal.violationSynced) {
                pushCbtStudentAnswerToCloud(existingLocal);
              }
              return;
            }
          }

          // 2. Lindungi status BUKA KUNCI lokal yang baru dilakukan agar tidak terkunci lagi oleh data lama server
          if (!localLocked && cloudLocked) {
            if (existingLocal.unlockedAt && (!cloudAns.lockedAt || Number(existingLocal.unlockedAt) >= Number(cloudAns.lockedAt))) {
              pushCbtStudentAnswerToCloud(existingLocal);
              return;
            }
          }

          // 3. Lindungi status SUDAH DIKUMPULKAN lokal agar tidak tertimpa oleh data server yang belum tersinkron
          if (existingLocal.isSubmitted && !cloudAns.isSubmitted) {
            pushCbtStudentAnswerToCloud(existingLocal);
            return;
          }

          // 4. Lindungi jawaban terbaru siswa jika lebih banyak daripada server saat ujian masih berlangsung
          if (!existingLocal.isSubmitted && !cloudAns.isSubmitted) {
            const localAnswerCount = Object.keys(existingLocal.answers || {}).length;
            const cloudAnswerCount = Object.keys(cloudAns.answers || {}).length;
            if (localAnswerCount > cloudAnswerCount) {
              local[matchedKey] = {
                ...cloudAns,
                answers: existingLocal.answers,
                doubtfuls: existingLocal.doubtfuls,
                audioPlayCount: existingLocal.audioPlayCount,
                violationCount: cloudLocked ? cloudAns.violationCount : existingLocal.violationCount,
                violationReason: cloudLocked ? cloudAns.violationReason : existingLocal.violationReason,
                violationTime: cloudLocked ? cloudAns.violationTime : existingLocal.violationTime,
                lockedAt: cloudLocked ? cloudAns.lockedAt : existingLocal.lockedAt,
                unlockedAt: existingLocal.unlockedAt || cloudAns.unlockedAt,
                violationSynced: cloudLocked ? true : existingLocal.violationSynced
              };
              return;
            }
          }

          local[matchedKey] = {
            ...cloudAns,
            violationSynced: cloudLocked
          };
        });

        // Bersihkan sesi "Mengerjakan" lama atau yatim yang sudah di-reset/dihapus dari database server
        const activePkgIds = new Set(getStoredCbtPackages().map(p => p.id));
        const nowMs = Date.now();
        for (const [k, localSess] of Object.entries(local)) {
          if (matchedLocalKeys.has(k)) continue;
          const pendingLock = isViolationSyncPending(localSess.examId, localSess.studentId, localSess.studentNisn);
          if (pendingLock) continue;
          const isOrphanedPkg = activePkgIds.size > 0 && !activePkgIds.has(localSess.examId);
          const startedMs = localSess.startedAt ? Date.parse(localSess.startedAt) : 0;
          const isStaleUnfinished = !localSess.isSubmitted && (isNaN(startedMs) || nowMs - startedMs > 10000);
          if (isOrphanedPkg || isStaleUnfinished) {
            delete local[k];
          }
        }

        localStorage.setItem(CBT_STUDENT_SESSIONS_KEY, JSON.stringify(local));
        window.dispatchEvent(new CustomEvent('cbtSessionsUpdated', { detail: { source: 'cloud_sync' } }));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT student answers notice (using cached data):', err);
  }
}

// -------------------------------------------------------------
// ASYNCHRONOUS BACKGROUND WRITERS TO HOSTINGER DATABASE
// -------------------------------------------------------------

export async function pushAssignmentToCloud(assignment: Assignment): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  unmarkDeletedAssignmentId(assignment.id);
  queuePendingAssignmentUpload(assignment);
  try {
    const res = await fetch('/api/elearning/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment)
    });
    if (res.ok) {
      dequeuePendingAssignmentUpload(assignment.id);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Background assignment upload queued:', err);
    return false;
  }
}

export async function pushSubmissionToCloud(submission: AssignmentSubmission): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const safeFileData =
    typeof submission.fileData === 'string' && submission.fileData.startsWith('blob:')
      ? undefined
      : submission.fileData;
  const payload: AssignmentSubmission = { ...submission, fileData: safeFileData };
  queuePendingSubmissionUpload(payload);
  try {
    const res = await fetch('/api/elearning/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      dequeuePendingSubmissionUpload(payload.id);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Background submission upload queued:', err);
    return false;
  }
}

export function pushSubjectSessionToCloud(session: SubjectSession): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('spentic_pending_sess_uploads_v1');
    const list: SubjectSession[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(s => s.id === session.id);
    if (idx >= 0) list[idx] = session;
    else list.push(session);
    localStorage.setItem('spentic_pending_sess_uploads_v1', JSON.stringify(list));
  } catch {}

  fetch('/api/elearning/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session)
  })
    .then(res => {
      if (res.ok) {
        try {
          const raw = localStorage.getItem('spentic_pending_sess_uploads_v1');
          if (raw) {
            const list: SubjectSession[] = JSON.parse(raw);
            const filtered = list.filter(s => s.id !== session.id);
            localStorage.setItem('spentic_pending_sess_uploads_v1', JSON.stringify(filtered));
          }
        } catch {}
      }
    })
    .catch(err => console.warn('Background session upload queued:', err));
}

export function pushCbtPackageToCloud(pkg: CbtExamPackage): void {
  if (typeof window === 'undefined') return;
  fetch('/api/cbt/packages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pkg)
  }).catch(err => console.warn('Background CBT package upload queued:', err));
}

export async function pushCbtStudentAnswerToCloud(
  answerState: CbtStudentAnswerState,
  options?: { keepalive?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/cbt/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answerState),
      keepalive: Boolean(options?.keepalive)
    });
    return res.ok;
  } catch (err) {
    console.warn('Background CBT answer upload queued:', err);
    return false;
  }
}

export async function pushCbtRoomsToCloud(
  rooms: CbtExamRoomConfig[],
  options?: { forceEmpty?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const payload = JSON.stringify({ rooms, forceEmpty: Boolean(options?.forceEmpty) });
    const res = await fetch('/api/cbt/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: payload.length < 60000
    });
    window.dispatchEvent(
      new CustomEvent('cbtRoomsSyncStatus', { detail: { status: res.ok ? 'synced' : 'error' } })
    );
    return res.ok;
  } catch (err) {
    console.warn('Background CBT rooms upload queued:', err);
    window.dispatchEvent(new CustomEvent('cbtRoomsSyncStatus', { detail: { status: 'error' } }));
    return false;
  }
}

export function pushCbtRoomSupervisorToCloud(params: {
  roomId?: string;
  roomName?: string;
  supervisorName: string;
}): void {
  if (typeof window === 'undefined') return;
  fetch('/api/cbt/rooms', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  }).catch(err => console.warn('Background CBT room supervisor update queued:', err));
}

export function deleteCbtPackageFromCloud(id: string): void {
  if (typeof window === 'undefined') return;
  fetch(`/api/cbt/packages?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Background CBT package delete queued:', err));
}

export async function deleteAssignmentFromCloud(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  recordDeletedAssignmentId(id);
  dequeuePendingAssignmentUpload(id);
  try {
    const res = await fetch(`/api/elearning/assignments?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('Background assignment delete queued:', err);
    return false;
  }
}
