import { ReactNode } from "react";
import { User } from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
}

export const AuthContext: React.Context<AuthContextType>;

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps>;
