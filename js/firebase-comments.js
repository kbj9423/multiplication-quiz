import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged,
  signInWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc,
  getDocs, query, orderBy, limit, where, serverTimestamp, Timestamp,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDezOLAjvNULnBgCxunb2u1cjqrAIqtQEs",
  authDomain: "arrowgame-e9ac7.firebaseapp.com",
  projectId: "arrowgame-e9ac7",
  storageBucket: "arrowgame-e9ac7.firebasestorage.app",
  messagingSenderId: "1023234573327",
  appId: "1:1023234573327:web:e76ac4dec80b929c130f7a",
};

const COMMENTS_COLLECTION = 'multiplication-comments';
const LAST_SEEN_KEY = 'mult-comments-last-seen';
const MAX_COMMENTS = 50;
const MAX_FIELD_LEN = 100;
const ADMIN_EMAIL = 'kbj9423@gmail.com';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authReady = new Promise((resolve, reject) => {
  onAuthStateChanged(auth, (user) => {
    if (user) resolve(user);
  });
  signInAnonymously(auth).catch(reject);
});

function getLastSeenMs() {
  try {
    return Number(localStorage.getItem(LAST_SEEN_KEY)) || 0;
  } catch (e) {
    return 0;
  }
}

function setLastSeenMs(ms) {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(ms));
  } catch (e) {
    // 저장소 사용 불가 시 조용히 무시
  }
}

async function fetchComments() {
  const q = query(collection(db, COMMENTS_COLLECTION), orderBy('createdAt', 'desc'), limit(MAX_COMMENTS));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      uid: data.uid || '',
      nickname: data.nickname || '익명',
      text: data.text || '',
      pinned: data.pinned || false,
      createdAtMs: data.createdAt ? data.createdAt.toMillis() : Date.now(),
    };
  });
}

async function postComment(nickname, text) {
  await authReady;
  await addDoc(collection(db, COMMENTS_COLLECTION), {
    nickname: nickname.slice(0, MAX_FIELD_LEN),
    text: text.slice(0, MAX_FIELD_LEN),
    uid: auth.currentUser.uid,
    createdAt: serverTimestamp(),
  });
}

async function updateComment(id, text) {
  await authReady;
  await updateDoc(doc(db, COMMENTS_COLLECTION, id), {
    text: text.slice(0, MAX_FIELD_LEN),
  });
}

async function deleteComment(id) {
  await authReady;
  await deleteDoc(doc(db, COMMENTS_COLLECTION, id));
}

async function togglePinned(id, pinned) {
  await authReady;
  await updateDoc(doc(db, COMMENTS_COLLECTION, id), { pinned: pinned });
}

async function signInAdmin(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

async function signOutAdmin() {
  await signOut(auth);
  await signInAnonymously(auth);
}

function isAdmin() {
  return !!(auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);
}

// 공백/기호를 지우고 소문자로 맞춰서, 띄어쓰기나 특수문자로 우회하는 걸 어느 정도 막는다.
function normalizeForProfanityCheck(text) {
  return String(text).toLowerCase().replace(/[\s.,!?~^*\-_/\\'"()[\]{}]/g, '');
}

let normalizedProfanityWords = [];
const profanityReady = getDoc(doc(db, 'app-config', 'profanity-words'))
  .then((snap) => {
    const words = snap.exists() ? (snap.data().words || []) : [];
    normalizedProfanityWords = words.map(normalizeForProfanityCheck).filter(Boolean);
  })
  .catch(() => {
    normalizedProfanityWords = [];
  });

async function containsProfanity(text) {
  await profanityReady;
  const normalized = normalizeForProfanityCheck(text);
  if (!normalized) return false;
  return normalizedProfanityWords.some((word) => normalized.includes(word));
}

// 마지막으로 확인한 시각 이후 새로 달린 댓글 수를 센다.
// 처음 방문(기록 없음)은 가입 전 댓글까지 전부 "안읽음"으로 뜨는 것을 막기 위해 0으로 처리하고 현재 시각을 기준점으로 저장한다.
async function getUnreadCount() {
  const lastSeen = getLastSeenMs();
  if (lastSeen === 0) {
    setLastSeenMs(Date.now());
    return 0;
  }
  const q = query(collection(db, COMMENTS_COLLECTION), where('createdAt', '>', Timestamp.fromMillis(lastSeen)));
  const snap = await getDocs(q);
  return snap.size;
}

function markAllSeen() {
  setLastSeenMs(Date.now());
}

function getCurrentUid() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

window.CommentService = {
  fetchComments,
  postComment,
  updateComment,
  deleteComment,
  togglePinned,
  signInAdmin,
  signOutAdmin,
  isAdmin,
  containsProfanity,
  getUnreadCount,
  markAllSeen,
  getCurrentUid,
};
window.dispatchEvent(new Event('mult-comment-service-ready'));
