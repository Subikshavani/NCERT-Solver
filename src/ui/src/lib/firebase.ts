import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

console.log('Firebase initialized successfully', { projectId: firebaseConfig.projectId });

// User data interface
interface StudentProfile {
    displayName?: string;
    email?: string;
    grade?: number;
    academicBoard?: string;
    studyPersona?: string;
    primaryGoal?: string;
    dailyGoalMinutes?: number;
    profileCompleted?: boolean;
    lessonsMastered?: number;
    doubtsAsked?: number;
    quizzesCompleted?: number;
    readiness?: number;
}

// Get student overview/profile data
export const getStudentOverview = async (userId: string): Promise<StudentProfile | null> => {
    try {
        const docRef = doc(db, 'students', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as StudentProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching student overview:', error);
        return null;
    }
};

// Log user progress
export const logProgress = async (
    userId: string,
    action: string,
    details?: Record<string, any>
): Promise<void> => {
    try {
        const userRef = doc(db, 'students', userId);
        const progressEntry = {
            action,
            details: details || {},
            timestamp: Timestamp.now(),
        };

        // Update user document with progress
        await updateDoc(userRef, {
            activity: arrayUnion(progressEntry),
        }).catch(async (error) => {
            // If document doesn't exist, create it
            if (error.code === 'not-found') {
                await setDoc(userRef, {
                    activity: [progressEntry],
                });
            } else {
                throw error;
            }
        });
    } catch (error) {
        console.error('Error logging progress:', error);
    }
};

// Get recent activity
export const getRecentActivity = async (userId: string, limit: number = 5): Promise<any[]> => {
    try {
        const docRef = doc(db, 'students', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const activity = docSnap.data().activity || [];
            return activity.slice(-limit).reverse();
        }
        return [];
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
    }
};

// Logout user
export const logoutUser = async (): Promise<void> => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<any> => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

// Update user profile
export const updateUserProfile = async (
    userId: string,
    profileData: StudentProfile
): Promise<void> => {
    try {
        const userRef = doc(db, 'students', userId);
        
        // Try to update, if document doesn't exist, create it
        await updateDoc(userRef, profileData as any).catch(async (error) => {
            if (error.code === 'not-found') {
                await setDoc(userRef, {
                    ...profileData,
                    createdAt: Timestamp.now(),
                });
            } else {
                throw error;
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};
