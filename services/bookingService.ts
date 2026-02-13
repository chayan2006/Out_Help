import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    orderBy,
    Timestamp,
    doc,
    updateDoc
} from 'firebase/firestore';
import { Booking } from '../types';

const COLLECTION_NAME = 'bookings';

// Create a new booking
export const createBooking = async (
    bookingData: Omit<Booking, 'id' | 'status' | 'helperName' | 'helperId'> & { customerId: string, customerName: string }
): Promise<string> => {
    try {
        console.log("bookingService: calling addDoc...");

        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...bookingData,
            status: 'Pending',
            createdAt: Timestamp.now(),
            date: new Date(bookingData.date).toISOString() // Ensure standard format
        });

        console.log("bookingService: addDoc success, ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

// Subscribe to a customer's bookings
export const subscribeToCustomerBookings = (
    customerId: string,
    callback: (bookings: Booking[]) => void,
    onError?: (error: Error) => void
) => {
    if (!customerId) {
        console.error("subscribeToCustomerBookings called with empty customerId");
        if (onError) onError(new Error("Invalid customer ID"));
        return () => { };
    }

    const q = query(
        collection(db, COLLECTION_NAME),
        where('customerId', '==', customerId)
        // orderBy('createdAt', 'desc') // Temporarily removed to fix loading if index is missing
    );

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Booking[];
        // Sort in client-side instead
        bookings.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });
        callback(bookings);
    }, (error) => {
        console.error("Error subscribing to customer bookings:", error);
        if (onError) onError(error);
    });
};

// Subscribe to incoming jobs for helpers (Pending status)
export const subscribeToIncomingJobs = (
    callback: (bookings: Booking[]) => void,
    onError?: (error: Error) => void
) => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'Pending')
        // orderBy('createdAt', 'desc') // Temporarily removed
    );

    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Booking[];

        // Sort in client-side instead
        bookings.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return timeB - timeA;
        });
        callback(bookings);
    }, (error) => {
        console.error("Error subscribing to incoming jobs:", error);
        if (onError) onError(error);
    });
};

// Accept a booking (Helper action)
export const acceptBooking = async (
    bookingId: string,
    helperId: string,
    helperName: string
) => {
    try {
        const bookingRef = doc(db, COLLECTION_NAME, bookingId);
        await updateDoc(bookingRef, {
            status: 'Confirmed',
            helperId,
            helperName,
            acceptedAt: Timestamp.now()
        });
    } catch (error) {
        console.error("Error accepting booking:", error);
        throw error;
    }
};

// Reject/Cancel a booking
export const updateBookingStatus = async (
    bookingId: string,
    status: 'Cancelled' | 'Completed' | 'Pending'
) => {
    try {
        const bookingRef = doc(db, COLLECTION_NAME, bookingId);
        await updateDoc(bookingRef, {
            status
        });
    } catch (error) {
        console.error("Error updating booking status:", error);
        throw error;
    }
};
