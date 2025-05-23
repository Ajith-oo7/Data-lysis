// Mock Firebase implementation for development
// This allows us to build the UI without actual Firebase dependency
// Later we can replace this with the real Firebase implementation

import { useEffect } from 'react';

// Types to match Firebase Auth
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface FirebaseAuth {
  currentUser: User | null;
  onAuthStateChanged: (callback: (user: User | null) => void) => void;
  signOut: () => Promise<void>;
}

// Mock user for testing UI
const mockUser: User = {
  uid: "mock-user-123",
  email: "user@example.com",
  displayName: "Test User",
  photoURL: null,
};

// Mock Firebase auth listeners
const authListeners: ((user: User | null) => void)[] = [];

// Firebase Configuration
// Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "dtalysis-1e8ab"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dtalysis-1e8ab",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "dtalysis-1e8ab"}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id",
};

// Log Firebase config (safe to log, no secrets)
console.log("Firebase config loaded (mock implementation):", firebaseConfig.projectId);

// Mock auth implementation
export const auth: FirebaseAuth = {
  currentUser: null,
  onAuthStateChanged: (callback) => {
    authListeners.push(callback);
    // Initially trigger with current mock state
    callback(auth.currentUser);
    return () => {
      // This would normally return an unsubscribe function
    };
  },
  signOut: async () => {
    auth.currentUser = null;
    authListeners.forEach(listener => listener(null));
    console.log("User signed out");
    return Promise.resolve();
  }
};

// Mock sign in function
export const signInWithGoogle = () => {
  // Simulate sign-in delay
  setTimeout(() => {
    auth.currentUser = mockUser;
    authListeners.forEach(listener => listener(mockUser));
    console.log("User signed in:", mockUser);
  }, 500);
};

// Custom hook for using auth
export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
};

// Mock Storage implementation
export interface StorageReference {
  fullPath: string;
  name: string;
}

// Mock file storage 
let mockFiles: { [key: string]: { name: string, fullPath: string, url: string, data: any } } = {};

export const storage = {
  ref: (path: string) => ({
    child: (fileName: string) => ({
      put: async (file: File) => {
        const fullPath = `${path}/${fileName}`;
        const fileObj = {
          name: fileName,
          fullPath,
          url: URL.createObjectURL(file),
          data: file
        };
        mockFiles[fullPath] = fileObj;
        console.log("File uploaded to storage", fileObj);
        return {
          ref: {
            getDownloadURL: async () => fileObj.url
          }
        };
      },
      getDownloadURL: async () => {
        const fullPath = `${path}/${fileName}`;
        return mockFiles[fullPath]?.url || "";
      }
    }),
    put: async (file: File) => {
      const fullPath = `${path}`;
      const fileObj = {
        name: file.name,
        fullPath,
        url: URL.createObjectURL(file),
        data: file
      };
      mockFiles[fullPath] = fileObj;
      console.log("File uploaded to storage", fileObj);
      return {
        ref: {
          getDownloadURL: async () => fileObj.url
        }
      };
    }
  }),
  listFiles: async (path: string) => {
    return Object.values(mockFiles)
      .filter(file => file.fullPath.startsWith(path))
      .map(file => ({
        name: file.name,
        fullPath: file.fullPath,
        url: file.url
      }));
  }
};

// Import useState here after the exports to avoid circular dependencies
import { useState } from 'react';