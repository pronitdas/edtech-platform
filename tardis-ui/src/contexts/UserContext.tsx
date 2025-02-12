import supabase from '@/services/supabase';
import { AuthUser } from '@supabase/supabase-js';
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define your user type (adjust as necessary)
interface User {
    email: string;
    id: string;
    oAiKey: string;
}

interface UserContextType {
    user: AuthUser | null;
    setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    let existingUser = null
    const [user, setUser] = useState(existingUser);
    
    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to access user context
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
