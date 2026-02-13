import { useEffect, useState } from 'react';
import { ref, onValue, set, push, serverTimestamp, DatabaseReference, Query } from 'firebase/database';
import { rtdb } from '../firebase';

export const useRealtimeDatabase = <T = any>(path: string) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const dbRef = ref(rtdb, path);

        const unsubscribe = onValue(dbRef, (snapshot) => {
            const val = snapshot.val();
            setData(val);
            setLoading(false);
        }, (err) => {
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [path]);

    const writeData = async (newData: T) => {
        try {
            const dbRef = ref(rtdb, path);
            await set(dbRef, newData);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const pushData = async (newData: any) => {
        try {
            const dbRef = ref(rtdb, path);
            const newRef = push(dbRef);
            await set(newRef, {
                ...newData,
                timestamp: serverTimestamp()
            });
            return newRef.key;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return { data, loading, error, writeData, pushData };
};
