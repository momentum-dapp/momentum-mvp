import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <DashboardClient />;
}
