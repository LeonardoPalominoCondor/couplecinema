import { doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export const saveProfile = (uid, data) => setDoc(doc(db, 'users', uid), data, { merge: true })

export async function createCouple(uid) {
  const id = Math.random().toString(36).slice(2, 8).toUpperCase()
  await setDoc(doc(db, 'couples', id), { members: [uid], createdAt: serverTimestamp() })
  await saveProfile(uid, { coupleId: id })
}

export async function joinCouple(uid, code) {
  const id = code.trim().toUpperCase()
  const ref = doc(db, 'couples', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('No encontramos ese código. Revisa que esté bien escrito.')
  const members = snap.data().members
  if (!members.includes(uid)) {
    if (members.length >= 2) throw new Error('Esa pareja ya está completa.')
    await updateDoc(ref, { members: arrayUnion(uid) })
  }
  await saveProfile(uid, { coupleId: id })
}

export const entryId = (m) => `${m.type}_${m.tmdbId}`

export const saveEntry = (cid, m, patch) =>
  setDoc(
    doc(db, 'couples', cid, 'entries', entryId(m)),
    {
      type: m.type, tmdbId: m.tmdbId, title: m.title, year: m.year || '',
      poster: m.poster || null, genres: m.genres || [],
      ...patch, updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

export const removeEntry = (cid, m) => deleteDoc(doc(db, 'couples', cid, 'entries', entryId(m)))
