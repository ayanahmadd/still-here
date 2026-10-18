import { notFound } from 'next/navigation';
import { gardenActivities } from '../../../lib/garden-activities';
import GardenGameClient from '../../../components/games/GardenGameClient';

export function generateStaticParams() { return gardenActivities.map(({ id }) => ({ activity: id })); }

export default async function ActivityPage({ params }: { params: Promise<{ activity: string }> }) {
  const { activity } = await params;
  const corner = gardenActivities.find(item => item.id === activity);
  if (!corner) notFound();
  return <GardenGameClient activity={corner.id} />;
}
