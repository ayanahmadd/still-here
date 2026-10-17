'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Leaf, X } from 'lucide-react';
import GardenDialog from './GardenDialog';
import GardenActivityIcon from './GardenActivityIcon';
import { gardenActivities } from '../lib/garden-activities';

export default function GardenActivities({ onOpen }: { onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const handle = useRef<HTMLButtonElement>(null);
  function close() { setOpen(false); requestAnimationFrame(() => handle.current?.focus()); }
  return <>
    <button ref={handle} className="garden-drawer-handle" aria-label="Garden activities" aria-expanded={open} aria-haspopup="dialog" onClick={() => { onOpen(); setOpen(true); }}><Leaf size={25} strokeWidth={1.4} /></button>
    {open && <GardenDialog className="garden-activities-drawer" title="Other quiet corners" onClose={close}>
      <p className="dialog-note">Something else to explore, whenever you choose.</p>
      <nav className="garden-activity-list" aria-label="Garden activities">{gardenActivities.map(activity => {
        return <Link href={'/activities/' + activity.id} className="garden-activity-card" key={activity.id}>
          <GardenActivityIcon kind={activity.icon} /><span><strong>{activity.name}</strong><span>{activity.description}</span><small>{activity.audience}</small><em>{activity.ready ? 'Explore' : 'Coming soon'}</em></span>
        </Link>;
      })}</nav>
      <button className="garden-text-button" onClick={close}><X size={17} />Close these corners</button>
    </GardenDialog>}
  </>;
}
