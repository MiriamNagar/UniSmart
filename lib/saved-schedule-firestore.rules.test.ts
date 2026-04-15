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
});
