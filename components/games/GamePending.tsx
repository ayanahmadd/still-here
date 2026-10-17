import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GardenActivityIcon from '../GardenActivityIcon';
import { gardenActivities } from '../../lib/garden-activities';

/** Honest fallback until the teammate replaces the corresponding src/games module. */
export default function GamePending({ activity }: { activity: typeof gardenActivities[number]['id'] }) {
  const corner = gardenActivities.find(item => item.id === activity)!;
  return <section>
    <GardenActivityIcon kind={corner.icon} />
    <p className="garden-eyebrow">A QUIET CORNER · COMING SOON</p>
    <h1>{corner.name}</h1><p>{corner.description}</p>
    <p>This quiet corner is still being prepared. Your garden is here whenever you would like to return.</p>
    <Link href="/?garden=1" className="garden-primary">Return to the garden<ArrowLeft size={18} /></Link>
  </section>;
}
