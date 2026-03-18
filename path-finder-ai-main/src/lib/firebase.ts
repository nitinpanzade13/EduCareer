// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBB1KnAtckAcvzfIj4Fn6xiPyJ83q3U_0",
  authDomain: "educareer-b9334.firebaseapp.com",
  projectId: "educareer-b9334",
  storageBucket: "educareer-b9334.firebasestorage.app",
  messagingSenderId: "568968438010",
  appId: "1:568968438010:web:3acc338fb32d35da1ba943",
  measurementId: "G-21NQX1VT7T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);