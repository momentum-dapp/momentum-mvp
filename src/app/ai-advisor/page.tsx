import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import AdvisorClient from './advisor-client';

export default async function AIAdvisorPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <AdvisorClient />;
}