import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === 'admin' || user.role === 'manager') {
      redirect('/admin');
    }
    redirect('/dashboard');
  }
  redirect('/login');
}
