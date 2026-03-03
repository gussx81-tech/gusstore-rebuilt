import type { AppUser, ProviderUser } from "@/types/user";

const PROVIDERS_STORAGE_KEY = "gusstore_providers_v1";
const SESSION_STORAGE_KEY = "gusstore_session_v1";
const PASSWORDS_STORAGE_KEY = "gusstore_passwords_v1";
const PROFILES_STORAGE_KEY = "gusstore_profiles_v1";

export const SUPER_ADMIN_ID = "super-admin-guss81";
export const SUPER_ADMIN_USERNAME = "Guss81";
export const SUPER_ADMIN_DEFAULT_PASSWORD = "Gustavo81@";
export const SUPER_ADMIN_PHONE = "51928862832";
export const SUPER_ADMIN_PROVIDER_NAME = "Gusstore";

const loadPasswordStore = (): Record<string, string> => {
  const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
};

const savePasswordStore = (store: Record<string, string>) => {
  localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(store));
};

const getAdminPassword = () => {
  const store = loadPasswordStore();
  if (store[SUPER_ADMIN_ID]) return store[SUPER_ADMIN_ID];

  const nextStore = { ...store, [SUPER_ADMIN_ID]: SUPER_ADMIN_DEFAULT_PASSWORD };
  savePasswordStore(nextStore);
  return SUPER_ADMIN_DEFAULT_PASSWORD;
};

const loadProfileStore = (): Record<string, { logo?: string }> => {
  const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Record<string, { logo?: string }>;
  } catch {
    return {};
  }
};

const saveProfileStore = (store: Record<string, { logo?: string }>) => {
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(store));
};

const toSuperAdminUser = (): AppUser => {
  const profileStore = loadProfileStore();
  return {
    id: SUPER_ADMIN_ID,
    username: SUPER_ADMIN_USERNAME,
    email: "admin@gusstore.lat",
    phone: SUPER_ADMIN_PHONE,
    providerName: SUPER_ADMIN_PROVIDER_NAME,
    logo: profileStore[SUPER_ADMIN_ID]?.logo,
    role: "super_admin",
  };
};

export const loadProviderUsers = (): ProviderUser[] => {
  const raw = localStorage.getItem(PROVIDERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as ProviderUser[];
    return parsed.filter((user) => user?.id && user?.username && user?.password && user?.phone && user?.providerName);
  } catch {
    return [];
  }
};

const saveProviderUsers = (users: ProviderUser[]) => {
  localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(users));
};

export const getUserById = (userId: string): AppUser | null => {
  if (userId === SUPER_ADMIN_ID) return toSuperAdminUser();
  return loadProviderUsers().find((user) => user.id === userId) || null;
};

export const loadSessionUser = (): AppUser | null => {
  const userId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!userId) return null;
  return getUserById(userId);
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const loginWithCredentials = (username: string, password: string): AppUser | null => {
  if (username.trim() === SUPER_ADMIN_USERNAME && password === getAdminPassword()) {
    const admin = toSuperAdminUser();
    localStorage.setItem(SESSION_STORAGE_KEY, admin.id);
    return admin;
  }

  const provider = loadProviderUsers().find((user) => user.username === username.trim() && user.password === password);
  if (!provider) return null;

  localStorage.setItem(SESSION_STORAGE_KEY, provider.id);
  return provider;
};

interface RegisterProviderInput {
  username: string;
  email: string;
  password: string;
  phone: string;
  providerName: string;
  logo?: string;
}

export const registerProvider = (input: RegisterProviderInput): { ok: boolean; error?: string } => {
  const users = loadProviderUsers();
  const username = input.username.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.replace(/\D/g, "");
  const providerName = input.providerName.trim();

  if (!username || !email || !input.password || !phone || !providerName) {
    return { ok: false, error: "Completa todos los campos obligatorios." };
  }

  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return { ok: false, error: "Ese usuario ya existe." };
  }

  if (users.some((user) => user.email.toLowerCase() === email)) {
    return { ok: false, error: "Ese email ya está registrado." };
  }

  users.unshift({
    id: crypto.randomUUID(),
    username,
    email,
    password: input.password,
    phone,
    providerName,
    logo: input.logo,
    role: "provider",
  });

  saveProviderUsers(users);
  return { ok: true };
};

export const updateUserProfile = (
  userId: string,
  updates: Partial<Pick<AppUser, "providerName" | "phone" | "logo">>,
): AppUser | null => {
  if (userId === SUPER_ADMIN_ID) {
    const store = loadProfileStore();
    saveProfileStore({ ...store, [SUPER_ADMIN_ID]: { logo: updates.logo } });
    return toSuperAdminUser();
  }

  const users = loadProviderUsers();
  const targetIndex = users.findIndex((user) => user.id === userId);
  if (targetIndex === -1) return null;

  const current = users[targetIndex];
  const next: ProviderUser = {
    ...current,
    providerName: updates.providerName?.trim() || current.providerName,
    phone: updates.phone?.replace(/\D/g, "") || current.phone,
    logo: updates.logo,
  };

  users[targetIndex] = next;
  saveProviderUsers(users);
  return next;
};

export const updateUserPassword = (
  userId: string,
  currentPassword: string,
  nextPassword: string,
): { ok: boolean; error?: string } => {
  if (!currentPassword || !nextPassword) {
    return { ok: false, error: "Completa ambas contraseñas." };
  }

  if (userId === SUPER_ADMIN_ID) {
    if (currentPassword !== getAdminPassword()) {
      return { ok: false, error: "La contraseña actual no coincide." };
    }

    const store = loadPasswordStore();
    savePasswordStore({ ...store, [SUPER_ADMIN_ID]: nextPassword });
    return { ok: true };
  }

  const users = loadProviderUsers();
  const targetIndex = users.findIndex((user) => user.id === userId);
  if (targetIndex === -1) {
    return { ok: false, error: "Usuario no encontrado." };
  }

  if (users[targetIndex].password !== currentPassword) {
    return { ok: false, error: "La contraseña actual no coincide." };
  }

  users[targetIndex] = { ...users[targetIndex], password: nextPassword };
  saveProviderUsers(users);
  return { ok: true };
};
