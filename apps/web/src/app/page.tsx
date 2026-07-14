import { redirect } from 'next/navigation';
import { loadCurrentPrincipalFromCookies } from '@/lib/auth/cookies';

export default async function Home() {
  const principal = await loadCurrentPrincipalFromCookies().catch(() => null);
  redirect(principal === null ? '/login' : '/dashboard');
}
