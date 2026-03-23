import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User, UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile;
  login: (email: string, fullName: string) => void;
  register: (email: string, fullName: string) => void;
  logout: () => void;
  updateProfile: (profileData: UserProfile) => void;
}

const defaultProfile: UserProfile = {
  name: "",
  age: "",
  email: "",
  phone: "",
  links: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): User | null {
  const userRaw = localStorage.getItem("creator_user");
  return userRaw ? (JSON.parse(userRaw) as User) : null;
}

function getStoredProfile(): UserProfile {
  const profileRaw = localStorage.getItem("creator_profile");
  return profileRaw ? (JSON.parse(profileRaw) as UserProfile) : defaultProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());

  const login = (email: string, fullName: string) => {
    const newUser = { email, fullName };
    setUser(newUser);
    localStorage.setItem("creator_user", JSON.stringify(newUser));
  };

  const register = (email: string, fullName: string) => {
    login(email, fullName);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("creator_user");
  };

  const updateProfile = (profileData: UserProfile) => {
    setProfile(profileData);
    localStorage.setItem("creator_profile", JSON.stringify(profileData));
  };

  const value = useMemo(
    () => ({ user, profile, login, register, logout, updateProfile }),
    [user, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
