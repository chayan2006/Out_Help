import { useState, useEffect } from 'react';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    QueryConstraint,
    query
} from 'firebase/firestore';
import { db } from '../firebase';

export const useFirestoreCollection = <T = any>(collectionName: string, ...queryConstraints: QueryConstraint[]) => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const colRef = collection(db, collectionName);
        const q = query(colRef, ...queryConstraints);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const results: any[] = [];
            snapshot.docs.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            setData(results);
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName]);

    const add = async (newData: any) => {
        try {
            const colRef = collection(db, collectionName);
            await addDoc(colRef, newData);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return { data, loading, error, add };
};

export const useFirestoreDoc = <T = any>(collectionName: string, docId: string) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!docId) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, collectionName, docId);

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                setData({ id: snapshot.id, ...snapshot.data() } as any);
            } else {
                setData(null);
            }
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, docId]);

    const update = async (newData: Partial<T>) => {
        try {
            const docRef = doc(db, collectionName, docId);
            await updateDoc(docRef, newData as any);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const set = async (newData: T) => {
        try {
            const docRef = doc(db, collectionName, docId);
            await setDoc(docRef, newData as any);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }

    return { data, loading, error, update, set };
};
