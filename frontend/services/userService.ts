const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export interface SQLProfile {
    uid: string;
    email: string;
    display_name: string;
    role: string;
    subscription_plan_id: string;
    subscription_status: string;
    created_at: string;
}

export const syncUserWithBackend = async (user: { uid: string, email: string | null, displayName: string | null, role: string }) => {
    try {
        await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: user.uid,
                email: user.email,
                display_name: user.displayName,
                role: user.role
            })
        });
    } catch (error) {
        console.error("Failed to sync user with backend:", error);
    }
};

export const getUserProfile = async (uid: string): Promise<SQLProfile | null> => {
    try {
        const response = await fetch(`${API_BASE}/api/users/${uid}`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch user profile:", error);
        return null;
    }
};
