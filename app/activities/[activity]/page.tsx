import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import GardenActivityIcon from '../../../components/GardenActivityIcon';
import { gardenActivities } from '../../../lib/garden-activities';

export function generateStaticParams() { return gardenActivities.map(({ id }) => ({ activity: id })); }

export default async function ActivityPage({ params }: { params: Promise<{ activity: string }> }) {
  const { activity } = await params;
  const corner = gardenActivities.find(item => item.id === activity);
  if (!corner) notFound();
  return <main className="garden-activity-page">
    <header><Link href="/?garden=1" className="garden-text-button"><ArrowLeft size={19} />Return to the garden</Link><span>Memory Garden</span></header>
    <section><GardenActivityIcon kind={corner.icon} /><p className="garden-eyebrow">A QUIET CORNER · COMING SOON</p><h1>{corner.name}</h1><p>{corner.description}</p><p>This quiet corner is still being prepared. Your garden is here whenever you would like to return.</p><Link href="/?garden=1" className="garden-primary">Return to the garden<ArrowLeft size={18} /></Link></section>
  </main>;
}
