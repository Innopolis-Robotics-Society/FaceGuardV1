const TOKEN_KEY = "faceguard_token";

export const tokenUtils = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
