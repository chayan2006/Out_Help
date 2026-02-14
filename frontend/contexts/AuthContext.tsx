import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    ConfirmationResult,
    sendEmailVerification
} from "firebase/auth";
import { auth } from "../firebase";
import Loading from "../components/Loading";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    verifyPhone: (number: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
    sendVerificationEmail: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Setting up auth listener with timeout race...");

        // 1. Setup the Firebase listener
        // We need a way to track if we've already handled the initial load
        let resolved = false;

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
            if (!resolved) {
                resolved = true;
                setUser(currentUser);
                setLoading(false);
            } else {
                // Subsequent updates (e.g. login/logout after initial load)
                setUser(currentUser);
            }
        });



        return () => {

            unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const signInWithEmail = async (email: string, pass: string) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        await createUserWithEmailAndPassword(auth, email, pass);
    };

    const verifyPhone = async (phoneNumber: string, verifier: RecaptchaVerifier) => {
        return await signInWithPhoneNumber(auth, phoneNumber, verifier);
    };

    const sendVerificationEmail = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, verifyPhone, sendVerificationEmail, logout }}>
            {loading ? <Loading /> : children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
