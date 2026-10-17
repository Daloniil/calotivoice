export type AuthProvider = 'email' | 'apple';

export type Session = {
  userId: string;
  provider: AuthProvider;
  email: string | null;
};
