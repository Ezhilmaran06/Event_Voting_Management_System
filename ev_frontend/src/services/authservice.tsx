import axios from "axios";

// src/services/authService.ts
export const API_BASE_URL = "http://localhost:3000"; // your backend URL

// Fetch all users (for demo; ideally, backend should handle OTP check)
export const fetchUsers = async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
};

// Send OTP to email via backend
export const sendOtp = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/users/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send OTP");
    }

    return response.json();
};

// Verify OTP via backend
export const verifyOtp = async (email: string, otp: string) => {
    const response = await fetch(`${API_BASE_URL}/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid OTP");
    }

    return response.json();
};


// Create new user
export const createUser = async (userData: any) => {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
};