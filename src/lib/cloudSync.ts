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
  CbtRoomAttendance,
  CbtSupervisorSchedule,
  extractPanitiaMeta,
  getStoredCbtPackages, 
  getStoredStudentCbtSessions,
  getStoredCbtPanitiaConfig,
  getStoredCbtRoomAttendances,
  isViolationSyncPending,
  isRoomsCloudSyncSafeToApply,
  isRoomsUploadPending,
  markRoomsUploadCompleted,
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
const CBT_ROOM_ATTENDANCE_KEY = 'spentic_cbt_room_attendance_v1';
const CBT_SUPERVISOR_SCHEDULES_MAP_KEY = 'cbt_supervisor_schedules_map_v1';
const CBT_SUPERVISOR_SCHEDULE_KEY = 'cbt_supervisor_schedule_v1';
const DELETED_ASG_KEY = 'spentic_deleted_asg_ids_v1';
const PENDING_ASG_UPLOADS_KEY = 'spentic_pending_asg_uploads_v1';
const PENDING_SUB_UPLOADS_KEY = 'spentic_pending_sub_uploads_v1';
const DELETED_CBT_PKG_KEY = 'spentic_deleted_cbt_pkg_ids_v1';
const PENDING_CBT_PKG_UPLOADS_KEY = 'spentic_pending_cbt_pkg_uploads_v1';
const CBT_INITIAL_MIGRATED_KEY = 'spentic_cbt_pkg_initial_migrated_v1';
const PENDING_CBT_ATT_UPLOADS_KEY = 'spentic_pending_cbt_att_uploads_v1';
const CBT_ATT_INITIAL_MIGRATED_KEY = 'spentic_cbt_att_initial_migrated_v1';
const PENDING_CBT_SCHED_UPLOADS_KEY = 'spentic_pending_cbt_sched_uploads_v1';
const CBT_SCHED_INITIAL_MIGRATED_KEY = 'spentic_cbt_sched_initial_migrated_v1';

// In-flight reset & unlock guards so window.focus after confirm()/alert() doesn't overwrite supervisor actions
const recentResetStudentSessions = new Map<string, number>();
const recentUnlockedStudentSessions = new Map<string, number>();

export function recordResetCbtStudentSession(examId: string, studentIdOrNisn: string): void {
  if (!examId || !studentIdOrNisn) return;
  recentResetStudentSessions.set(`${examId}_${studentIdOrNisn}`, Date.now());
}

export function clearResetCbtStudentSessionGuard(examId: string, studentIdOrNisn: string): void {
  if (!examId || !studentIdOrNisn) return;
  recentResetStudentSessions.delete(`${examId}_${studentIdOrNisn}`);
}

export function isCbtStudentSessionRecentlyReset(examId: string, studentId?: string, studentNisn?: string): boolean {
  if (!examId) return false;
  const now = Date.now();
  const checkKey = (k: string) => {
    const ts = recentResetStudentSessions.get(k);
    if (!ts) return false;
    if (now - ts > 15000) {
      recentResetStudentSessions.delete(k);
      return false;
    }
    return true;
  };
  if (studentId && checkKey(`${examId}_${studentId}`)) return true;
  if (studentNisn && checkKey(`${examId}_${studentNisn}`)) return true;
  return false;
}

export function recordUnlockedCbtStudentSession(examId: string, studentIdOrNisn: string): void {
  if (!examId || !studentIdOrNisn) return;
  recentUnlockedStudentSessions.set(`${examId}_${studentIdOrNisn}`, Date.now());
}

export function isCbtStudentSessionRecentlyUnlocked(examId: string, studentId?: string, studentNisn?: string): boolean {
  if (!examId) return false;
  const now = Date.now();
  const checkKey = (k: string) => {
    const ts = recentUnlockedStudentSessions.get(k);
    if (!ts) return false;
    if (now - ts > 15000) {
      recentUnlockedStudentSessions.delete(k);
      return false;
    }
    return true;
  };
  if (studentId && checkKey(`${examId}_${studentId}`)) return true;
  if (studentNisn && checkKey(`${examId}_${studentNisn}`)) return true;
  return false;
}

export function getCbtRoomAttendanceCompositeKey(att: Pick<CbtRoomAttendance, 'roomName' | 'examId' | 'date'>): string {
  return `${att.roomName}_${att.examId}_${toLocalDateString(att.date)}`;
}

export function queuePendingCbtRoomAttendanceUpload(att: CbtRoomAttendance): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_CBT_ATT_UPLOADS_KEY);
    const map: Record<string, CbtRoomAttendance> = raw ? JSON.parse(raw) : {};
    const key = getCbtRoomAttendanceCompositeKey(att);
    map[key] = { ...att, date: toLocalDateString(att.date) };
    localStorage.setItem(PENDING_CBT_ATT_UPLOADS_KEY, JSON.stringify(map));
  } catch {}
}

export function dequeuePendingCbtRoomAttendanceUpload(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_CBT_ATT_UPLOADS_KEY);
    if (!raw) return;
    const map: Record<string, CbtRoomAttendance> = JSON.parse(raw);
    if (map[key]) {
      delete map[key];
      localStorage.setItem(PENDING_CBT_ATT_UPLOADS_KEY, JSON.stringify(map));
    }
  } catch {}
}

export function getPendingCbtRoomAttendanceUploads(): Record<string, CbtRoomAttendance> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PENDING_CBT_ATT_UPLOADS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function queuePendingCbtScheduleUpload(schedule: CbtSupervisorSchedule): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_CBT_SCHED_UPLOADS_KEY);
    const map: Record<string, CbtSupervisorSchedule> = raw ? JSON.parse(raw) : {};
    const dateKey = toLocalDateString(schedule.examDate);
    map[dateKey] = { ...schedule, examDate: dateKey };
    localStorage.setItem(PENDING_CBT_SCHED_UPLOADS_KEY, JSON.stringify(map));
  } catch {}
}

export function dequeuePendingCbtScheduleUpload(examDate: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_CBT_SCHED_UPLOADS_KEY);
    if (!raw) return;
    const map: Record<string, CbtSupervisorSchedule> = JSON.parse(raw);
    const dateKey = toLocalDateString(examDate);
    if (map[dateKey]) {
      delete map[dateKey];
      localStorage.setItem(PENDING_CBT_SCHED_UPLOADS_KEY, JSON.stringify(map));
    }
  } catch {}
}

export function getPendingCbtScheduleUploads(): Record<string, CbtSupervisorSchedule> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PENDING_CBT_SCHED_UPLOADS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Tombstone tracking for deleted CBT exam packages
export function getDeletedCbtPackageIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_CBT_PKG_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function recordDeletedCbtPackageId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedCbtPackageIds();
    current.add(id);
    localStorage.setItem(DELETED_CBT_PKG_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

export function unmarkDeletedCbtPackageId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedCbtPackageIds();
    if (current.has(id)) {
      current.delete(id);
      localStorage.setItem(DELETED_CBT_PKG_KEY, JSON.stringify(Array.from(current)));
    }
  } catch {}
}

export function queuePendingCbtPackageUpload(pkg: CbtExamPackage): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_CBT_PKG_UPLOADS_KEY);
    const list: CbtExamPackage[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(p => p.id === pkg.id);
    if (idx >= 0) list[idx] = pkg;
    else list.push(pkg);
    localStorage.setItem(PENDING_CBT_PKG_UPLOADS_KEY, JSON.stringify(list));
  } catch {}
}

export function dequeuePendingCbtPackageUpload(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PENDING_CBT_PKG_UPLOADS_KEY);
    if (!raw) return;
    const list: CbtExamPackage[] = JSON.parse(raw);
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem(PENDING_CBT_PKG_UPLOADS_KEY, JSON.stringify(filtered));
  } catch {}
}

export function getPendingCbtPackageUploads(): CbtExamPackage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_CBT_PKG_UPLOADS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

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
    // 3. Sync Subject Sessions (Presensi & Jurnal + Meja Piket): Database MariaDB is Single Source of Truth
    const sessRes = await fetch('/api/elearning/sessions', { cache: 'no-store' });
    if (sessRes.ok) {
      const { data, piketDutyTeacher } = await sessRes.json();
      if (piketDutyTeacher && typeof piketDutyTeacher === 'string') {
        const prevOfficer = localStorage.getItem('spentic_piket_duty_teacher_v1');
        if (prevOfficer !== piketDutyTeacher) {
          localStorage.setItem('spentic_piket_duty_teacher_v1', piketDutyTeacher);
          window.dispatchEvent(new CustomEvent('elearningPiketOfficerUpdated', { detail: piketDutyTeacher }));
        }
      }
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

        // Sinkronkan juga ringkasan attendanceData harian (spentic_elearning_attendance_v2) untuk Meja Piket Live Hari Ini
        try {
          const todayStr = toLocalDateString(new Date());
          const todaySessions = authoritativeSessions.filter(s => toLocalDateString(s.date) === todayStr);
          if (todaySessions.length > 0) {
            const rawAtt = localStorage.getItem('spentic_elearning_attendance_v2');
            const attMap: Record<string, any> = rawAtt ? JSON.parse(rawAtt) : {};
            const byClass = new Map<string, SubjectSession[]>();
            for (const sess of todaySessions) {
              if (!sess.classId) continue;
              const arr = byClass.get(sess.classId) || [];
              arr.push(sess);
              byClass.set(sess.classId, arr);
            }
            for (const [clsId, clsSessions] of byClass.entries()) {
              const mergedRecords: Record<string, any> = { ...(attMap[clsId]?.records || {}) };
              const mergedNotes: Record<string, string> = { ...(attMap[clsId]?.notes || {}) };
              // Prioritaskan sesi piket / sesi terakhir, serta anomali (S/I/A/T/K) dari sesi mapel hari ini
              for (const cs of clsSessions) {
                if (cs.records) {
                  for (const [stId, stVal] of Object.entries(cs.records)) {
                    if (mergedRecords[stId] === undefined || stVal !== 'H' || String(cs.id).endsWith('_PIKET')) {
                      mergedRecords[stId] = stVal;
                    }
                  }
                }
                if (cs.notes) {
                  for (const [stId, nVal] of Object.entries(cs.notes)) {
                    if (nVal) mergedNotes[stId] = nVal;
                  }
                }
              }
              const latestSess = clsSessions[0];
              attMap[clsId] = {
                classId: clsId,
                date: todayStr,
                subject: latestSess.subject,
                teacherName: latestSess.teacherName,
                teacherNip: latestSess.teacherNip,
                isSubmitted: true,
                submittedAt: latestSess.submittedAt,
                records: mergedRecords,
                notes: mergedNotes
              };
            }
            localStorage.setItem('spentic_elearning_attendance_v2', JSON.stringify(attMap));
            window.dispatchEvent(new Event('elearningAttendanceUpdated'));
          }
        } catch {}
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

  const deletedPkgIds = getDeletedCbtPackageIds();
  window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'syncing' } }));

  try {
    // 1. Sync CBT Exam Packages (MariaDB Single Source of Truth + Pending Queue & Tombstone Guard)
    const pkgRes = await fetch('/api/cbt/packages', { cache: 'no-store' });
    if (pkgRes.ok) {
      const { data } = await pkgRes.json();
      if (Array.isArray(data)) {
        // If cloud still has any package that was explicitly deleted, delete from cloud
        data.forEach((cloudPkg: CbtExamPackage) => {
          if (deletedPkgIds.has(cloudPkg.id)) {
            deleteCbtPackageFromCloud(cloudPkg.id);
          }
        });

        const pkgMap = new Map<string, CbtExamPackage>();
        data
          .filter((p: any) => {
            if (!p || !p.id || deletedPkgIds.has(p.id)) return false;
            const tName = p.teacherName || '';
            return !tName.includes('Cucu Rohaeti') && !tName.includes('Erma Rismayanti');
          })
          .forEach((p: any) => {
            const questions = Array.isArray(p.questions)
              ? p.questions.map((q: any, idx: number) => ({ ...q, number: idx + 1 }))
              : [];
            pkgMap.set(p.id, {
              ...p,
              examDate: toLocalDateString(p.examDate),
              questions,
              totalQuestions: questions.length
            });
          });

        // One-time migration: if browser localStorage had existing teacher packages before cloud sync was active, queue them once
        try {
          if (!localStorage.getItem(CBT_INITIAL_MIGRATED_KEY)) {
            const localPkgs = getStoredCbtPackages();
            for (const localPkg of localPkgs) {
              if (localPkg && localPkg.id && !deletedPkgIds.has(localPkg.id) && !pkgMap.has(localPkg.id)) {
                queuePendingCbtPackageUpload(localPkg);
              }
            }
            localStorage.setItem(CBT_INITIAL_MIGRATED_KEY, '1');
          }
        } catch {}

        // Overlay & retry any queued/in-flight teacher CBT package or question edits so they are never overwritten
        try {
          const pendingList = getPendingCbtPackageUploads();
          for (const pendingPkg of pendingList) {
            if (pendingPkg && pendingPkg.id && !deletedPkgIds.has(pendingPkg.id)) {
              const questions = Array.isArray(pendingPkg.questions)
                ? pendingPkg.questions.map((q, idx) => ({ ...q, number: idx + 1 }))
                : [];
              const normalizedPending: CbtExamPackage = {
                ...pendingPkg,
                examDate: toLocalDateString(pendingPkg.examDate),
                questions,
                totalQuestions: questions.length
              };
              pkgMap.set(normalizedPending.id, normalizedPending);
              await pushCbtPackageToCloud(normalizedPending);
            }
          }
        } catch {}

        const authoritativePackages = Array.from(pkgMap.values());
        localStorage.setItem(CBT_PACKAGES_KEY, JSON.stringify(authoritativePackages));
        window.dispatchEvent(new Event('cbtPackagesUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT packages notice (using cached data):', err);
  }

  try {
    // 2. Sync CBT Exam Rooms & Global Panitia Config Meta (Lindungi perubahan Panitia lokal yang baru dibuat atau masih tertunda)
    if (!isRoomsCloudSyncSafeToApply()) {
      if (isRoomsUploadPending()) {
        const localCfg = getStoredCbtPanitiaConfig();
        const ok = await pushCbtRoomsToCloud(localCfg.rooms, {
          forceEmpty: getLastRoomsForceEmpty(),
          meta: extractPanitiaMeta(localCfg)
        });
        if (ok) markRoomsUploadCompleted();
      }
    } else {
      const roomRes = await fetch('/api/cbt/rooms', { cache: 'no-store' });
      if (roomRes.ok) {
        const { data, meta } = await roomRes.json();
        if (isRoomsCloudSyncSafeToApply() && ((Array.isArray(data) && data.length > 0) || (meta && typeof meta === 'object'))) {
          const currentConfig = getStoredCbtPanitiaConfig();
          const updatedConfig = {
            ...currentConfig,
            ...(meta && typeof meta === 'object' ? meta : {}),
            ...(Array.isArray(data) && data.length > 0 ? { rooms: data } : {})
          };
          localStorage.setItem(CBT_PANITIA_CONFIG_KEY, JSON.stringify(updatedConfig));
          window.dispatchEvent(new CustomEvent('cbtPanitiaConfigUpdated', { detail: updatedConfig }));
        }
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT rooms notice (using cached data):', err);
  }

  try {
    // 3. Sync CBT Student Results / Answers (Race-Safe, Reset-Safe & Violation-Safe Merge)
    // Flush any pending Panitia/Supervisor resets & unlocks first so MariaDB stays authoritative
    const pendingResetKeys = new Set<string>();
    try {
      const rawResets = localStorage.getItem('spentic_pending_cbt_resets_v1');
      if (rawResets) {
        const resetMap: Record<string, { examId: string; ids: string[]; ts: number }> = JSON.parse(rawResets) || {};
        let mutated = false;
        for (const [rKey, item] of Object.entries(resetMap)) {
          if (!item?.examId || !Array.isArray(item.ids)) {
            delete resetMap[rKey];
            mutated = true;
            continue;
          }
          item.ids.forEach(id => pendingResetKeys.add(`${item.examId}_${id}`));
          const results = await Promise.all(
            item.ids.map(sid =>
              fetch(`/api/cbt/answers?examId=${encodeURIComponent(item.examId)}&studentId=${encodeURIComponent(sid)}&nisn=${encodeURIComponent(sid)}`, {
                method: 'DELETE'
              })
                .then(r => r.ok)
                .catch(() => false)
            )
          );
          if (results.every(Boolean)) {
            delete resetMap[rKey];
            mutated = true;
          }
        }
        if (mutated) {
          localStorage.setItem('spentic_pending_cbt_resets_v1', JSON.stringify(resetMap));
        }
      }
    } catch {}

    try {
      const rawUnlocks = localStorage.getItem('spentic_pending_cbt_unlocks_v1');
      if (rawUnlocks) {
        const unlockMap: Record<string, CbtStudentAnswerState> = JSON.parse(rawUnlocks) || {};
        let mutated = false;
        for (const [uKey, sess] of Object.entries(unlockMap)) {
          const ok = await pushCbtStudentAnswerToCloud(sess);
          if (ok) {
            delete unlockMap[uKey];
            mutated = true;
          }
        }
        if (mutated) {
          localStorage.setItem('spentic_pending_cbt_unlocks_v1', JSON.stringify(unlockMap));
        }
      }
    } catch {}

    const ansRes = await fetch('/api/cbt/answers', { cache: 'no-store' });
    if (ansRes.ok) {
      const { data } = await ansRes.json();
      if (Array.isArray(data)) {
        const local = getStoredStudentCbtSessions();
        const matchedLocalKeys = new Set<string>();

        data.forEach((cloudAns: CbtStudentAnswerState) => {
          if (deletedPkgIds.has(cloudAns.examId)) return;

          // Lindungi sesi siswa yang baru saja di-reset guru/pengawas/panitia dari race condition window.focus
          if (
            isCbtStudentSessionRecentlyReset(cloudAns.examId, cloudAns.studentId, cloudAns.studentNisn) ||
            (cloudAns.studentId && pendingResetKeys.has(`${cloudAns.examId}_${cloudAns.studentId}`)) ||
            (cloudAns.studentNisn && pendingResetKeys.has(`${cloudAns.examId}_${cloudAns.studentNisn}`))
          ) {
            return;
          }

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
            const recentlyUnlocked = isCbtStudentSessionRecentlyUnlocked(
              cloudAns.examId,
              cloudAns.studentId || existingLocal.studentId,
              cloudAns.studentNisn || existingLocal.studentNisn
            );
            if (
              recentlyUnlocked ||
              (existingLocal.unlockedAt && (!cloudAns.lockedAt || Number(existingLocal.unlockedAt) >= Number(cloudAns.lockedAt)))
            ) {
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

  try {
    // 4. Sync CBT Room Attendances & BAP (Mode Pengawas & Posko Panitia)
    const attRes = await fetch('/api/cbt/attendances', { cache: 'no-store' });
    if (attRes.ok) {
      const { data } = await attRes.json();
      if (Array.isArray(data)) {
        const attMap: Record<string, CbtRoomAttendance> = {};
        data.forEach((cloudAtt: CbtRoomAttendance) => {
          if (cloudAtt?.roomName && cloudAtt?.examId) {
            const cleanDate = toLocalDateString(cloudAtt.date);
            const key = `${cloudAtt.roomName}_${cloudAtt.examId}_${cleanDate}`;
            attMap[key] = {
              ...cloudAtt,
              date: cleanDate,
              records: cloudAtt.records || {}
            };
          }
        });

        // One-time migration: push any existing local room attendances to MariaDB
        try {
          if (!localStorage.getItem(CBT_ATT_INITIAL_MIGRATED_KEY)) {
            const localAtts = getStoredCbtRoomAttendances();
            for (const [k, localAtt] of Object.entries(localAtts)) {
              if (localAtt?.roomName && localAtt?.examId && !attMap[k]) {
                queuePendingCbtRoomAttendanceUpload(localAtt);
              }
            }
            localStorage.setItem(CBT_ATT_INITIAL_MIGRATED_KEY, '1');
          }
        } catch {}

        // Overlay & retry any queued/in-flight room attendance or BAP updates from Mode Pengawas
        try {
          const pendingAtts = getPendingCbtRoomAttendanceUploads();
          for (const [k, pendAtt] of Object.entries(pendingAtts)) {
            if (pendAtt?.roomName && pendAtt?.examId) {
              const existingCloud = attMap[k];
              const mergedRecords = {
                ...(existingCloud?.records || {}),
                ...(pendAtt.records || {})
              };
              const mergedAtt: CbtRoomAttendance = {
                ...pendAtt,
                date: toLocalDateString(pendAtt.date),
                records: mergedRecords
              };
              attMap[k] = mergedAtt;
              await pushCbtRoomAttendanceToCloud(mergedAtt);
            }
          }
        } catch {}

        localStorage.setItem(CBT_ROOM_ATTENDANCE_KEY, JSON.stringify(attMap));
        window.dispatchEvent(new Event('cbtAttendanceUpdated'));
        window.dispatchEvent(new Event('cbtRoomAttendancesUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT room attendances notice (using cached data):', err);
  }

  try {
    // 5. Sync CBT Supervisor Schedules (Penugasan Pengawas Ruang per Sesi Jam 1, Jam 2, dst.)
    const schedRes = await fetch('/api/cbt/schedules', { cache: 'no-store' });
    if (schedRes.ok) {
      const { data } = await schedRes.json();
      if (Array.isArray(data)) {
        let localMap: Record<string, CbtSupervisorSchedule> = {};
        try {
          const rawMap = localStorage.getItem(CBT_SUPERVISOR_SCHEDULES_MAP_KEY);
          if (rawMap) localMap = JSON.parse(rawMap) || {};
        } catch {}

        data.forEach((cloudSched: CbtSupervisorSchedule) => {
          if (cloudSched?.examDate && Array.isArray(cloudSched.entries)) {
            const cleanDate = toLocalDateString(cloudSched.examDate);
            localMap[cleanDate] = {
              ...cloudSched,
              examDate: cleanDate
            };
          }
        });

        // One-time migration: push any existing user-edited local schedules to MariaDB
        try {
          if (!localStorage.getItem(CBT_SCHED_INITIAL_MIGRATED_KEY)) {
            for (const sched of Object.values(localMap)) {
              if (sched?.examDate && sched?.isUserEdited && Array.isArray(sched.entries) && sched.entries.length > 0) {
                queuePendingCbtScheduleUpload(sched);
              }
            }
            const rawSingle = localStorage.getItem(CBT_SUPERVISOR_SCHEDULE_KEY);
            if (rawSingle) {
              const parsedSingle: CbtSupervisorSchedule = JSON.parse(rawSingle);
              if (parsedSingle?.examDate && parsedSingle?.isUserEdited && Array.isArray(parsedSingle.entries)) {
                queuePendingCbtScheduleUpload(parsedSingle);
              }
            }
            localStorage.setItem(CBT_SCHED_INITIAL_MIGRATED_KEY, '1');
          }
        } catch {}

        // Overlay & retry any queued/in-flight supervisor schedule updates
        try {
          const pendingScheds = getPendingCbtScheduleUploads();
          for (const [dKey, pendSched] of Object.entries(pendingScheds)) {
            if (pendSched?.examDate) {
              localMap[dKey] = pendSched;
              await pushCbtSupervisorScheduleToCloud(pendSched);
            }
          }
        } catch {}

        localStorage.setItem(CBT_SUPERVISOR_SCHEDULES_MAP_KEY, JSON.stringify(localMap));
        const todayDate = toLocalDateString(new Date());
        const storedActiveDate = localStorage.getItem('cbt_active_schedule_date');
        const resolvedDate =
          (storedActiveDate && localMap[storedActiveDate] ? storedActiveDate : '') ||
          (localMap[todayDate] ? todayDate : '') ||
          (data[0]?.examDate ? toLocalDateString(data[0].examDate) : todayDate);
        if (localMap[resolvedDate]) {
          if (!storedActiveDate || !localMap[storedActiveDate]) {
            localStorage.setItem('cbt_active_schedule_date', resolvedDate);
          }
          localStorage.setItem(CBT_SUPERVISOR_SCHEDULE_KEY, JSON.stringify(localMap[resolvedDate]));
        }
        window.dispatchEvent(new Event('cbtSupervisorScheduleUpdated'));
      }
    }
  } catch (err) {
    console.warn('Cloud sync CBT supervisor schedules notice (using cached data):', err);
  }

  window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'synced' } }));
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

export async function pushCbtPackageToCloud(pkg: CbtExamPackage): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  unmarkDeletedCbtPackageId(pkg.id);
  queuePendingCbtPackageUpload(pkg);
  window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'syncing' } }));
  try {
    const res = await fetch('/api/cbt/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg)
    });
    if (res.ok) {
      dequeuePendingCbtPackageUpload(pkg.id);
      window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'synced' } }));
      return true;
    }
    window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'error' } }));
    return false;
  } catch (err) {
    console.warn('Background CBT package upload queued:', err);
    window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'error' } }));
    return false;
  }
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
  options?: { forceEmpty?: boolean; meta?: Record<string, any> }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const payload = JSON.stringify({
      rooms,
      forceEmpty: Boolean(options?.forceEmpty),
      ...(options?.meta ? { meta: options.meta } : {})
    });
    const res = await fetch('/api/cbt/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: payload.length < 60000
    });
    if (res.ok) markRoomsUploadCompleted();
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

export async function pushCbtRoomAttendanceToCloud(
  attendance: CbtRoomAttendance,
  options?: { mergeRecordsOnly?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const cleanAtt: CbtRoomAttendance = {
    ...attendance,
    date: toLocalDateString(attendance.date)
  };
  const key = getCbtRoomAttendanceCompositeKey(cleanAtt);
  queuePendingCbtRoomAttendanceUpload(cleanAtt);
  try {
    const res = await fetch('/api/cbt/attendances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cleanAtt,
        mergeRecordsOnly: Boolean(options?.mergeRecordsOnly)
      })
    });
    if (res.ok) {
      dequeuePendingCbtRoomAttendanceUpload(key);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Background CBT room attendance upload queued:', err);
    return false;
  }
}

export async function pushCbtSupervisorScheduleToCloud(
  schedule: CbtSupervisorSchedule
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const cleanDate = toLocalDateString(schedule.examDate);
  const cleanSched: CbtSupervisorSchedule = {
    ...schedule,
    examDate: cleanDate
  };
  queuePendingCbtScheduleUpload(cleanSched);
  try {
    const res = await fetch('/api/cbt/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanSched)
    });
    if (res.ok) {
      dequeuePendingCbtScheduleUpload(cleanDate);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Background CBT supervisor schedule upload queued:', err);
    return false;
  }
}

export async function deleteCbtPackageFromCloud(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  recordDeletedCbtPackageId(id);
  dequeuePendingCbtPackageUpload(id);
  window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'syncing' } }));
  try {
    const res = await fetch(`/api/cbt/packages?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    window.dispatchEvent(
      new CustomEvent('cbtCloudSyncStatus', { detail: { status: res.ok ? 'synced' : 'error' } })
    );
    return res.ok;
  } catch (err) {
    console.warn('Background CBT package delete queued:', err);
    window.dispatchEvent(new CustomEvent('cbtCloudSyncStatus', { detail: { status: 'error' } }));
    return false;
  }
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
