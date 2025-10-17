import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import TransactionHistoryClient from './transaction-history-client';

export default async function TransactionHistoryPage() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return <TransactionHistoryClient />;
}
