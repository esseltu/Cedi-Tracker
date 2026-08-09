import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Migration helper to inspect and backfill missing `uid` on legacy transactions.
 * If a current logged-in user runs this or standard query runs, it ensures 
 * no transaction document remains un-owned.
 */
export const auditAndMigrateTransactionUids = async (currentUserUid) => {
  if (!currentUserUid) return { audited: 0, migrated: 0 };

  try {
    const querySnapshot = await getDocs(collection(db, 'transactions'));
    let audited = 0;
    let migrated = 0;

    for (const document of querySnapshot.docs) {
      audited++;
      const data = document.data();
      
      // If a document lacks `uid`, backfill with current user's UID
      if (!data.uid) {
        console.warn(`Backfilling missing uid for document ${document.id}`);
        await updateDoc(doc(db, 'transactions', document.id), {
          uid: currentUserUid
        });
        migrated++;
      }
    }

    return { audited, migrated };
  } catch (error) {
    console.error("Migration check failed:", error);
    return { audited: 0, migrated: 0, error };
  }
};
