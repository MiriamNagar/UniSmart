/** @jest-environment node */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const hasEmulatorHost = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const describeIfEmulator = hasEmulatorHost ? describe : describe.skip;

describeIfEmulator('saved schedule Firestore rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const projectId = `unismart-rules-${Date.now()}`;
    const rules = await fs.readFile(path.resolve(__dirname, '../firestore.rules'), 'utf8');
    const host = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080';
    const [emulatorHost, emulatorPort] = host.split(':');

    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        host: emulatorHost,
        port: Number(emulatorPort),
        rules,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('allows owner to create and read a saved schedule at their path', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/savedSchedules/plan-1');

    await assertSucceeds(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
      }),
    );

    await assertSucceeds(getDoc(ownerDoc));
  });

  it('denies create when ownerUid does not match auth/path uid', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/savedSchedules/plan-1');

    await assertFails(
      setDoc(ownerDoc, {
        ownerUid: 'student-2',
      }),
    );
  });

  it('denies cross-user read', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/savedSchedules/plan-1'), {
        ownerUid: 'student-1',
      });
    });

    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const otherUserRead = doc(otherUserDb, 'users/student-1/savedSchedules/plan-1');

    await assertFails(getDoc(otherUserRead));
  });

  it('denies updates that attempt to change ownerUid', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/savedSchedules/plan-1'), {
        ownerUid: 'student-1',
      });
    });

    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/savedSchedules/plan-1');

    await assertFails(updateDoc(ownerDoc, { ownerUid: 'student-2' }));
  });

  it('allows owner delete when ownerUid matches auth uid', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/savedSchedules/plan-1'), {
        ownerUid: 'student-1',
      });
    });

    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/savedSchedules/plan-1');

    await assertSucceeds(deleteDoc(ownerDoc));
  });

  it('allows owner to create and read a note folder at their path', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/noteFolders/general');

    await assertSucceeds(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        scope: 'general',
        name: 'General Notes',
      }),
    );

    await assertSucceeds(getDoc(ownerDoc));
  });

  it('denies cross-user read for note folders', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/noteFolders/general'), {
        ownerUid: 'student-1',
        scope: 'general',
        name: 'General Notes',
      });
    });

    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const otherUserRead = doc(otherUserDb, 'users/student-1/noteFolders/general');

    await assertFails(getDoc(otherUserRead));
  });

  it('denies note folder create when name is missing', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/noteFolders/general');

    await assertFails(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        scope: 'general',
      }),
    );
  });

  it('denies course-scoped note folder when courseCode is missing', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/noteFolders/course-CS101');

    await assertFails(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        scope: 'course',
        name: 'CS101: Intro to CS',
      }),
    );
  });

  it('allows course-scoped note folder with valid courseCode', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/noteFolders/course-CS101');

    await assertSucceeds(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        scope: 'course',
        name: 'CS101: Intro to CS',
        courseCode: 'CS101',
      }),
    );
  });

  it('allows owner to create and read note attachment metadata rows', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(
      ownerDb,
      'users/student-1/noteFolders/general/attachments/attachment-1',
    );

    await assertSucceeds(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        folderId: 'general',
        folderName: 'General Notes',
        type: 'document',
        fileName: 'Lecture 1.pdf',
        contentType: 'application/pdf',
        storagePath: 'users/student-1/noteAttachments/general/lecture-1.pdf',
        downloadUrl: 'https://example.com/lecture-1.pdf',
        createdAtMs: Date.now(),
      }),
    );

    await assertSucceeds(getDoc(ownerDoc));
  });

  it('denies note attachment create when folderId does not match path folder', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(
      ownerDb,
      'users/student-1/noteFolders/general/attachments/attachment-1',
    );

    await assertFails(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        folderId: 'custom-folder',
        folderName: 'General Notes',
        type: 'document',
        fileName: 'Lecture 1.pdf',
        contentType: 'application/pdf',
        storagePath: 'users/student-1/noteAttachments/general/lecture-1.pdf',
        downloadUrl: 'https://example.com/lecture-1.pdf',
        createdAtMs: Date.now(),
      }),
    );
  });

  it('denies cross-user read for note attachments', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          'users/student-1/noteFolders/general/attachments/attachment-1',
        ),
        {
          ownerUid: 'student-1',
          folderId: 'general',
          folderName: 'General Notes',
          type: 'image',
          fileName: 'board.jpg',
          contentType: 'image/jpeg',
          storagePath: 'users/student-1/noteAttachments/general/board.jpg',
          downloadUrl: 'https://example.com/board.jpg',
          createdAtMs: Date.now(),
        },
      );
    });

    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const otherUserRead = doc(
      otherUserDb,
      'users/student-1/noteFolders/general/attachments/attachment-1',
    );

    await assertFails(getDoc(otherUserRead));
  });
});
