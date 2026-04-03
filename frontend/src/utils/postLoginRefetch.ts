/** Setelah redirect dari login, beberapa browser/race membuat fetch pertama gagal; refetch tertunda memperbaiki logo & dashboard. */

export const POST_LOGIN_SESSION_KEY = 'imb_post_login';

export function markSessionAfterLogin(): void {
  try {
    sessionStorage.setItem(POST_LOGIN_SESSION_KEY, '1');
  } catch {
    /* private mode / quota */
  }
}

export function shouldDeferRefetchAfterLogin(): boolean {
  try {
    return sessionStorage.getItem(POST_LOGIN_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPostLoginSessionFlag(): void {
  try {
    sessionStorage.removeItem(POST_LOGIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
