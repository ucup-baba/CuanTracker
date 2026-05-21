import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseJs = fs.readFileSync('./src/firebase.js', 'utf8');
const configMatch = firebaseJs.match(/const firebaseConfig = ({[\s\S]*?});/);

const configStr = configMatch[1]
  .replace(/apiKey:/, '"apiKey":')
  .replace(/authDomain:/, '"authDomain":')
  .replace(/projectId:/, '"projectId":')
  .replace(/storageBucket:/, '"storageBucket":')
  .replace(/messagingSenderId:/, '"messagingSenderId":')
  .replace(/appId:/, '"appId":')
  .replace(/measurementId:/, '"measurementId":')
  .replace(/'/g, '"');

const firebaseConfig = JSON.parse(configStr);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const asramaSnap = await getDoc(doc(db, 'globalSettings', 'asramaCategories'));
  console.log("Asrama Categories:", asramaSnap.data());
  
  const pribadiSnap = await getDoc(doc(db, 'globalSettings', 'categories'));
  console.log("Pribadi Categories:", pribadiSnap.data());
  process.exit(0);
}
check();
