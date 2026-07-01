import { initializeApp } from "firebase/app";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const env = readFileSync(envPath, "utf8");

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    process.env[key] = value;
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(`Missing Firebase config: ${missingKeys.join(", ")}`);
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const wallets = {
  junhyun: {
    owner: "준현",
    friends: [
      ["jaehyung", "재형"],
      ["jaeyoung", "재영"],
      ["haewook", "해욱"],
      ["hyunsik", "현식"],
      ["byunghun", "병훈"],
      ["taesu", "태수"],
    ],
  },
  byunghun: {
    owner: "병훈",
    friends: [
      ["jaehyung", "재형"],
      ["jaeyoung", "재영"],
      ["haewook", "해욱"],
      ["hyunsik", "현식"],
      ["junhyun", "준현"],
      ["taesu", "태수"],
    ],
  },
};

async function createIfMissing(pathLabel, ref, data) {
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    console.log(`Exists: ${pathLabel}`);
    return;
  }

  await setDoc(ref, data);
  console.log(`Created: ${pathLabel}`);
}

for (const [walletId, wallet] of Object.entries(wallets)) {
  const walletRef = doc(db, "wallets", walletId);

  try {
    await createIfMissing(`wallets/${walletId}`, walletRef, {
      owner: wallet.owner,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn(`Skipped wallets/${walletId}: ${error.message}`);
    console.warn("If your rules block wallets/{walletId} writes, this is okay. The app mainly reads wallets/{walletId}/friends.");
  }

  for (const [friendId, name] of wallet.friends) {
    await createIfMissing(`wallets/${walletId}/friends/${friendId}`, doc(db, "wallets", walletId, "friends", friendId), {
      name,
      amount: 0,
      lastDelta: 0,
      updatedBy: walletId,
      updatedAt: serverTimestamp(),
    });
  }
}

console.log("Wallet seed complete.");
