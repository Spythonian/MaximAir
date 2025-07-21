export interface Episode {
  id: number;
  title: string;
  description: string;
  duration: string;
  date: string;
  category: string;
  audioFile?: string;
  status: 'published' | 'draft';
}

// In a real app, this would be stored in a database
let episodes: Episode[] = [
  {
    id: 1,
    title: "The Morning Mix",
    description: "Start your day with the perfect blend of music and conversation",
    duration: "2:30:00",
    date: "2025-01-15",
    category: "Music",
    status: "published"
  },
  {
    id: 2,
    title: "Tech Talk Tuesday",
    description: "Latest technology trends and innovations discussed",
    duration: "1:45:00",
    date: "2025-01-14",
    category: "Technology",
    status: "published"
  },
  {
    id: 3,
    title: "Weekend Vibes",
    description: "Relaxing tunes and feel-good music for your weekend",
    duration: "3:00:00",
    date: "2025-01-13",
    category: "Music",
    status: "published"
  },
  {
    id: 4,
    title: "Celebrity Spotlight",
    description: "Exclusive interviews with your favorite stars",
    duration: "1:20:00",
    date: "2025-01-12",
    category: "Interview",
    status: "published"
  },
  {
    id: 5,
    title: "Local Stories",
    description: "Highlighting amazing stories from our community",
    duration: "2:00:00",
    date: "2025-01-11",
    category: "Community",
    status: "published"
  },
  {
    id: 6,
    title: "Throwback Thursday",
    description: "Classic hits from the 80s, 90s, and 2000s",
    duration: "2:15:00",
    date: "2025-01-10",
    category: "Music",
    status: "published"
  }
];

export function getPublishedEpisodes(): Episode[] {
  return episodes.filter(episode => episode.status === 'published');
}

export function getAllEpisodes(): Episode[] {
  return episodes;
}

export function addEpisode(episode: Omit<Episode, 'id'>): Episode {
  const newEpisode = {
    ...episode,
    id: Math.max(...episodes.map(e => e.id), 0) + 1
  };
  episodes.unshift(newEpisode);
  return newEpisode;
}

export function updateEpisode(id: number, updates: Partial<Episode>): Episode | null {
  const index = episodes.findIndex(ep => ep.id === id);
  if (index === -1) return null;
  
  episodes[index] = { ...episodes[index], ...updates };
  return episodes[index];
}

export function deleteEpisode(id: number): boolean {
  const index = episodes.findIndex(ep => ep.id === id);
  if (index === -1) return false;
  
  episodes.splice(index, 1);
  return true;
}

export function getEpisodeById(id: number): Episode | null {
  return episodes.find(ep => ep.id === id) || null;
}