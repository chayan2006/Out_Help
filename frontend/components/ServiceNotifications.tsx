import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToCustomerBookings } from '../services/bookingService';
import { Booking } from '../types';
import { Bell, MapPin, CheckCircle, Clock, X } from 'lucide-react';

const ServiceNotifications: React.FC = () => {
    const { user } = useAuth();
    const [latestNotification, setLatestNotification] = useState<{
        message: string;
        type: 'info' | 'success' | 'warning';
        bookingId: string;
    } | null>(null);

    // We use a ref to track the previous state of bookings to detect changes
    const previousBookingsRef = useRef<Record<string, string>>({});

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToCustomerBookings(user.uid, (bookings) => {
            bookings.forEach(booking => {
                const prevStatus = previousBookingsRef.current[booking.id];

                // If this is a status change, trigger a notification
                if (prevStatus && prevStatus !== booking.status) {
                    let message = "";
                    let type: 'info' | 'success' | 'warning' = 'info';

                    switch (booking.status) {
                        case 'Confirmed':
                            message = `Job for ${booking.service} is confirmed! Helper is preparing.`;
                            type = 'success';
                            break;
                        case 'Completed':
                            message = `Good news! Your ${booking.service} service is complete.`;
                            type = 'success';
                            break;
                        case 'Cancelled':
                            message = `Your ${booking.service} booking has been cancelled.`;
                            type = 'warning';
                            break;
                        default:
                            message = `Update: ${booking.service} is now ${booking.status}.`;
                    }

                    if (message) {
                        setLatestNotification({ message, type, bookingId: booking.id });
                        // Clear notification after 10 seconds
                        setTimeout(() => setLatestNotification(null), 10000);
                    }
                }

                // Update the ref
                previousBookingsRef.current[booking.id] = booking.status;
            });

            // Special simulation for "Service reach" (Helper is near)
            // In a real app, this would be triggered by a geofence or helper status update
            const activeBooking = bookings.find(b => b.status === 'Confirmed' || b.status === 'InProgress');
            if (activeBooking && !latestNotification) {
                // Randomly simulate an arrival notification for demo purposes if it's confirmed
                // In production, this would be a real Firestore field like 'eta' or 'isArriving'
                if (Math.random() > 0.8) {
                    setLatestNotification({
                        message: `Your TrustServe partner for ${activeBooking.service} is arriving now!`,
                        type: 'info',
                        bookingId: activeBooking.id
                    });
                    setTimeout(() => setLatestNotification(null), 8000);
                }
            }

        }, (error) => {
            console.error("Notification subscription error:", error);
        });

        return () => unsubscribe();
    }, [user]);

    if (!latestNotification) return null;

    return (
        <div className="fixed top-20 right-6 z-[10000] animate-in fade-in slide-in-from-right-8 duration-500">
            <div className={`flex items-start gap-4 p-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-md ${latestNotification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                latestNotification.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                    'bg-indigo-50 border-indigo-200 text-indigo-800'
                }`}>
                <div className={`p-2 rounded-xl flex-shrink-0 ${latestNotification.type === 'success' ? 'bg-emerald-200 text-emerald-700' :
                    latestNotification.type === 'warning' ? 'bg-amber-200 text-amber-700' :
                        'bg-indigo-200 text-indigo-700'
                    }`}>
                    {latestNotification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                        latestNotification.type === 'warning' ? <Bell className="w-5 h-5" /> :
                            <MapPin className="w-5 h-5 animate-bounce" />}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-60">Real-time Update</span>
                        <button onClick={() => setLatestNotification(null)} className="opacity-40 hover:opacity-100 p-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-sm font-semibold leading-relaxed">{latestNotification.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 bg-current opacity-10 rounded-full overflow-hidden">
                            <div className="h-full bg-current animate-progress-shrink h-1"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Error: Need X from lucide-react but it's not imported above
// Fixing that in a moment.

export default ServiceNotifications;
