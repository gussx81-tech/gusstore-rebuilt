export type UserRole = "super_admin" | "provider";

export interface AppUser {
  id: string;
  username: string;
  email: string;
  phone: string;
  providerName: string;
  logo?: string;
  role: UserRole;
}

export interface ProviderUser extends AppUser {
  role: "provider";
  password: string;
}
