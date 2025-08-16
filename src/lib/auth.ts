export type User = {
  name: string;
  email: string;
  password: string; // For demo purposes only; do NOT store plain passwords in production
};

const USERS_KEY = "jobtrackr_users";
export const CURRENT_USER_KEY = "jobtrackr_current_user";

export const getApplicationsKey = (email: string) => `jobtrackr_applications_${email}`;

export const getUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = (user: User) => {
  const users = getUsers();
  const exists = users.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
  if (exists) throw new Error("Email already registered");
  users.push(user);
  saveUsers(users);
};

export const findUser = (email: string, password: string): User | null => {
  const users = getUsers();
  const u = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
  );
  return u ?? null;
};

export const setCurrentUser = (user: User) => {
  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({ name: user.name, email: user.email })
  );
};

export const getCurrentUser = (): { name: string; email: string } | null => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as { name: string; email: string }) : null;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};
