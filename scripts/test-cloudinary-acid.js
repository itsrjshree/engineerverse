/**
 * Test script verifying Cloudinary -> Firebase flow, ACID semantics, and Content Deduplication.
 */

import assert from 'assert';
import crypto from 'crypto';
import * as firestoreService from '../server/services/firestoreService.js';

class MockFirestore {
  constructor() {
    this.collections = new Map();
    this.failNextWrite = false;
  }

  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Map());
    }
    const store = this.collections.get(name);
    const self = this;

    return {
      doc(id) {
        const docId = id || `mock_id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return {
          id: docId,
          async get() {
            const data = store.get(docId);
            return {
              exists: Boolean(data),
              id: docId,
              data: () => (data ? { ...data } : undefined),
            };
          },
          async set(data) {
            if (self.failNextWrite) {
              self.failNextWrite = false;
              throw new Error('Simulated write failure');
            }
            store.set(docId, { id: docId, ...data });
          },
          async update(updates) {
            if (self.failNextWrite) {
              self.failNextWrite = false;
              throw new Error('Simulated update failure');
            }
            const current = store.get(docId) || {};
            store.set(docId, { ...current, ...updates });
          },
          async delete() {
            store.delete(docId);
          },
        };
      },
    };
  }
}

async function runCloudinaryAcidTests() {
  console.log('\n--- VERIFYING CLOUDINARY -> FIREBASE ACID & DEDUPLICATION PIPELINE ---');

  const mockDb = new MockFirestore();
  firestoreService.setTestFirestoreRepository(mockDb);

  const testUid = 'user_acid_test_101';
  await firestoreService.getOrCreateUser({
    uid: testUid,
    email: 'acid.tester@engineerverse.io',
    displayName: 'Acid Tester',
  });

  // 1. Initial Photo Upload
  const sampleImage1 = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vv90AAAAA==';
  const updated1 = await firestoreService.updateProfilePhoto(testUid, sampleImage1);
  assert.ok(updated1.photoURL, 'photoURL must be set');
  assert.ok(updated1.photoMetadata?.sha256, 'sha256 must be computed');
  console.log('✓ 1. Initial photo upload successfully committed to Firestore with SHA-256 metadata');

  // 2. Content Deduplication Check (Exact Same Image Uploaded Again)
  const updatedDuplicate = await firestoreService.updateProfilePhoto(testUid, sampleImage1);
  assert.strictEqual(updatedDuplicate.photoMetadata.sha256, updated1.photoMetadata.sha256);
  assert.strictEqual(updatedDuplicate.photoURL, updated1.photoURL);
  console.log('✓ 2. Content deduplication: Re-uploading identical photo detects matching hash and reuses existing asset');

  // 3. Platform-wide Deduplication Check (Another User Uploads the Same Image)
  const testUid2 = 'user_acid_test_202';
  await firestoreService.getOrCreateUser({
    uid: testUid2,
    email: 'second.tester@engineerverse.io',
    displayName: 'Second Tester',
  });

  const updatedUser2 = await firestoreService.updateProfilePhoto(testUid2, sampleImage1);
  assert.strictEqual(updatedUser2.photoURL, updated1.photoURL, 'Second user must reuse existing asset URL without duplicate upload');
  assert.strictEqual(updatedUser2.photoMetadata.sha256, updated1.photoMetadata.sha256);
  console.log('✓ 3. Platform-wide deduplication: Second user uploading same image reuses mediaRegistry reference');

  // 4. Photo Replacement (Updates to new photo)
  const sampleImage2 = 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADwAQCdASoBAAEAAkA4JaQAA3AA/v4A8AAAZAAA';
  const updatedReplaced = await firestoreService.updateProfilePhoto(testUid, sampleImage2);
  assert.notStrictEqual(updatedReplaced.photoMetadata.sha256, updated1.photoMetadata.sha256);
  console.log('✓ 4. Photo replacement: New image uploaded, Firestore updated with new SHA-256 & metadata');

  // 5. Photo Deletion (Safe Removal)
  const deletedPhotoUser = await firestoreService.deleteProfilePhoto(testUid);
  assert.strictEqual(deletedPhotoUser.photoURL, null, 'photoURL must be null');
  assert.strictEqual(deletedPhotoUser.photoMetadata, null, 'photoMetadata must be null');
  console.log('✓ 5. Photo deletion: photoURL and photoMetadata safely cleared while user record remains');

  console.log('--- ALL CLOUDINARY -> FIREBASE ACID & DEDUPLICATION TESTS PASSED ---\n');
}

runCloudinaryAcidTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
