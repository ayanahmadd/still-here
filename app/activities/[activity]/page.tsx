import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { gardenActivities } from '../../../lib/garden-activities';
import PictureTogether from '../../../src/games/PictureTogether';
import FamiliarSounds from '../../../src/games/FamiliarSounds';
import LittleNotes from '../../../src/games/LittleNotes';

const activityComponents = {
  'picture-together': PictureTogether,
  'familiar-sounds': FamiliarSounds,
  'little-notes': LittleNotes,
};

export function generateStaticParams() { return gardenActivities.map(({ id }) => ({ activity: id })); }

export default async function ActivityPage({ params }: { params: Promise<{ activity: string }> }) {
  const { activity } = await params;
  const corner = gardenActivities.find(item => item.id === activity);
  if (!corner) notFound();
  const Game = activityComponents[corner.id];
  return <main className="garden-activity-page">
    <header><Link href="/?garden=1" className="garden-text-button"><ArrowLeft size={19} />Return to the garden</Link><span>Memory Garden</span></header>
    <Game />
  </main>;
}
