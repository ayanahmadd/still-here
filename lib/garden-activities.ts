// Routes import src/games modules directly. Flip ready only after gameplay is implemented.
export const gardenActivities = [
  { id: 'picture-together', name: 'Picture Together', description: 'Share a picture and a little moment together.', audience: 'Families & friends', icon: 'picture', ready: false },
  { id: 'familiar-sounds', name: 'Familiar Sounds', description: 'Spend a little time with sounds that feel close to you.', audience: 'With a companion', icon: 'sounds', ready: true },
  { id: 'little-notes', name: 'Little Notes', description: 'Leave a few kind words for someone close to you.', audience: 'Families & friends', icon: 'notes', ready: true },
] as const;
