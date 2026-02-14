import { Booking, EarningRecord, UserRole } from '../types';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Create a new booking
export const createBooking = async (
    bookingData: Omit<Booking, 'id' | 'status' | 'helperName' | 'helperId'> & { customerId: string, customerName: string }
): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        const data = await response.json();
        return data.id;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

// Polling version of subscribe (standard for non-realtime SQL)
export const subscribeToCustomerBookings = (
    customerId: string,
    callback: (bookings: Booking[]) => void,
    onError?: (error: Error) => void
) => {
    const fetchBookings = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/bookings?userId=${customerId}&role=CUSTOMER`);
            const data = await response.json();
            callback(data);
        } catch (error) {
            if (onError) onError(error as Error);
        }
    };

    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
};

// Subscribe to incoming jobs for helpers
export const subscribeToIncomingJobs = (
    helperId: string,
    callback: (bookings: Booking[]) => void,
    onError?: (error: Error) => void
) => {
    const fetchJobs = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/bookings?userId=${helperId}&role=HELPER`);
            const data = await response.json();
            callback(data);
        } catch (error) {
            if (onError) onError(error as Error);
        }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
};

// Accept a booking
export const acceptBooking = async (
    bookingId: string,
    helperId: string,
    helperName: string
) => {
    try {
        await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Confirmed', helperId, helperName })
        });
    } catch (error) {
        console.error("Error accepting booking:", error);
        throw error;
    }
};

// Update booking status
export const updateBookingStatus = async (
    bookingId: string,
    status: 'Cancelled' | 'Completed' | 'Pending' | 'InProgress'
) => {
    try {
        await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
    } catch (error) {
        console.error("Error updating booking status:", error);
        throw error;
    }
};

// Record helper earning (Now handled on backend status update)
export const recordEarning = async (earning: Omit<EarningRecord, 'id'>) => {
    // Legacy support, backend handles this now on Completed status
    console.log("Earnings are now recorded automatically by the backend.");
};

// Fetch helper earnings
export const fetchHelperEarnings = async (helperId: string): Promise<EarningRecord[]> => {
    try {
        const response = await fetch(`${API_BASE}/api/earnings/${helperId}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching earnings:", error);
        return [];
    }
};
