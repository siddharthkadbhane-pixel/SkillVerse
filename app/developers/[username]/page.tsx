import { redirect } from 'next/navigation';

export default async function DevelopersAliasPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/developer/${username}`);
}
