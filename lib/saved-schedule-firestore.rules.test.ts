/** @jest-environment node */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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

  it('denies cross-user create for saved schedules', async () => {
    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const forgedDoc = doc(otherUserDb, 'users/student-1/savedSchedules/plan-forged');

    await assertFails(
      setDoc(forgedDoc, {
        ownerUid: 'student-1',
      }),
    );
  });

  it('denies unauthenticated read for saved schedules', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/savedSchedules/plan-1'), {
        ownerUid: 'student-1',
      });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    const anonRead = doc(anonDb, 'users/student-1/savedSchedules/plan-1');
    await assertFails(getDoc(anonRead));
  });

  it('denies unauthenticated create for saved schedules', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    const anonWrite = doc(anonDb, 'users/student-1/savedSchedules/plan-1');

    await assertFails(
      setDoc(anonWrite, {
        ownerUid: 'student-1',
      }),
    );
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

  it('allows owner to create and read a waitlist interest at their path', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/waitlistInterests/interest-1');

    await assertSucceeds(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        courseId: 'CS101',
        sectionId: 'CS101-1',
        status: 'waitlist',
      }),
    );

    await assertSucceeds(getDoc(ownerDoc));
  });

  it('denies waitlist interest create when ownerUid mismatches auth/path uid', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/waitlistInterests/interest-1');

    await assertFails(
      setDoc(ownerDoc, {
        ownerUid: 'student-2',
        courseId: 'CS101',
        sectionId: 'CS101-1',
        status: 'waitlist',
      }),
    );
  });

  it('denies cross-user read for waitlist interests', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/waitlistInterests/interest-1'), {
        ownerUid: 'student-1',
        courseId: 'CS101',
        sectionId: 'CS101-1',
        status: 'waitlist',
      });
    });

    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const otherUserRead = doc(otherUserDb, 'users/student-1/waitlistInterests/interest-1');

    await assertFails(getDoc(otherUserRead));
  });

  it('allows owner to register and clear push token metadata on their user profile', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1');

    await assertSucceeds(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        role: 'student',
      }),
    );

    await assertSucceeds(
      updateDoc(ownerDoc, {
        pushToken: 'ExponentPushToken[student-1]',
        pushTokenProvider: 'expo',
        pushTokenUpdatedAtMs: Date.now(),
      }),
    );

    await assertSucceeds(
      updateDoc(ownerDoc, {
        pushToken: deleteField(),
        pushTokenProvider: deleteField(),
        pushTokenUpdatedAtMs: deleteField(),
      }),
    );
  });

  it('denies cross-user push token writes under users/{uid}', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1'), {
        role: 'student',
      });
    });

    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const otherUserDoc = doc(otherUserDb, 'users/student-1');
    await assertFails(
      updateDoc(otherUserDoc, {
        pushToken: 'ExponentPushToken[forged]',
      }),
    );
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

  it('denies cross-user create for note folders', async () => {
    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const forgedDoc = doc(otherUserDb, 'users/student-1/noteFolders/general');

    await assertFails(
      setDoc(forgedDoc, {
        ownerUid: 'student-1',
        scope: 'general',
        name: 'General Notes',
      }),
    );
  });

  it('denies unauthenticated read for note folders', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/noteFolders/general'), {
        ownerUid: 'student-1',
        scope: 'general',
        name: 'General Notes',
      });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    const anonRead = doc(anonDb, 'users/student-1/noteFolders/general');
    await assertFails(getDoc(anonRead));
  });

  it('denies admin cross-user read for note folders', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/noteFolders/general'), {
        ownerUid: 'student-1',
        scope: 'general',
        name: 'General Notes',
      });
    });

    const adminDb = testEnv.authenticatedContext('admin-1').firestore();
    const adminRead = doc(adminDb, 'users/student-1/noteFolders/general');
    await assertFails(getDoc(adminRead));
  });

  it('denies admin cross-user create for note folders', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1').firestore();
    const forgedDoc = doc(adminDb, 'users/student-1/noteFolders/general');

    await assertFails(
      setDoc(forgedDoc, {
        ownerUid: 'admin-1',
        scope: 'general',
        name: 'General Notes',
      }),
    );
  });

  it('allows admin to create and read owner-scoped note folders', async () => {
    const adminDb = testEnv.authenticatedContext('admin-1').firestore();
    const adminDoc = doc(adminDb, 'users/admin-1/noteFolders/general');

    await assertSucceeds(
      setDoc(adminDoc, {
        ownerUid: 'admin-1',
        scope: 'general',
        name: 'General Notes',
      }),
    );

    await assertSucceeds(getDoc(adminDoc));
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

  it('denies unauthenticated read for note attachments', async () => {
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

    const anonDb = testEnv.unauthenticatedContext().firestore();
    const anonRead = doc(
      anonDb,
      'users/student-1/noteFolders/general/attachments/attachment-1',
    );

    await assertFails(getDoc(anonRead));
  });

  it('denies admin cross-user reads for student note attachments', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(
          context.firestore(),
          'users/student-1/noteFolders/general/attachments/attachment-2',
        ),
        {
          ownerUid: 'student-1',
          folderId: 'general',
          folderName: 'General Notes',
          type: 'document',
          fileName: 'lecture.pdf',
          contentType: 'application/pdf',
          storagePath: 'users/student-1/noteAttachments/general/lecture.pdf',
          downloadUrl: 'https://example.com/lecture.pdf',
          createdAtMs: Date.now(),
        },
      );
    });

    const adminDb = testEnv.authenticatedContext('admin-1').firestore();
    const crossUserRead = doc(
      adminDb,
      'users/student-1/noteFolders/general/attachments/attachment-2',
    );

    await assertFails(getDoc(crossUserRead));
  });

  it('allows owner to create and read an alert row at their path', async () => {
    const ownerDb = testEnv.authenticatedContext('student-1').firestore();
    const ownerDoc = doc(ownerDb, 'users/student-1/alerts/alert-1');

    await assertSucceeds(
      setDoc(ownerDoc, {
        ownerUid: 'student-1',
        title: 'Seat opened',
        message: 'Section A now has a seat',
        isRead: false,
        createdAtMs: Date.now(),
      }),
    );

    await assertSucceeds(getDoc(ownerDoc));
  });

  it('denies cross-user read for alerts', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/alerts/alert-1'), {
        ownerUid: 'student-1',
        title: 'Seat opened',
        message: 'Section A now has a seat',
        isRead: false,
        createdAtMs: Date.now(),
      });
    });

    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const otherUserRead = doc(otherUserDb, 'users/student-1/alerts/alert-1');

    await assertFails(getDoc(otherUserRead));
  });

  it('denies cross-user create for alerts', async () => {
    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const forgedDoc = doc(otherUserDb, 'users/student-1/alerts/alert-1');

    await assertFails(
      setDoc(forgedDoc, {
        ownerUid: 'student-1',
        title: 'Seat opened',
        message: 'Section A now has a seat',
        isRead: false,
        createdAtMs: Date.now(),
      }),
    );
  });

  it('denies cross-user update for alerts', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/alerts/alert-1'), {
        ownerUid: 'student-1',
        title: 'Seat opened',
        message: 'Section A now has a seat',
        isRead: false,
        createdAtMs: Date.now(),
      });
    });

    const otherUserDb = testEnv.authenticatedContext('student-2').firestore();
    const otherUserDoc = doc(otherUserDb, 'users/student-1/alerts/alert-1');

    await assertFails(
      updateDoc(otherUserDoc, {
        isRead: true,
      }),
    );
  });

  it('denies unauthenticated read for alerts', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/student-1/alerts/alert-1'), {
        ownerUid: 'student-1',
        title: 'Seat opened',
        message: 'Section A now has a seat',
        isRead: false,
        createdAtMs: Date.now(),
      });
    });

    const anonDb = testEnv.unauthenticatedContext().firestore();
    const anonRead = doc(anonDb, 'users/student-1/alerts/alert-1');
    await assertFails(getDoc(anonRead));
  });
});
