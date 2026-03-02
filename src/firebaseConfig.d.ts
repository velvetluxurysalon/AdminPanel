declare module '**/firebaseConfig.js' {
  import { Firestore } from 'firebase/firestore';
  
  export const db: Firestore;
}

declare module '**/firebaseConfig.ts' {
  import { Firestore } from 'firebase/firestore';
  
  export const db: Firestore;
}
