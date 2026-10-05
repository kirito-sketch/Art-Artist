/*
 * Seed reviews. Hours are counted from each film's release, so the two films out this week always read as
 * reviewed over the last few days. Nobody here reviews a film they are credited on or a house they belong to.
 * Read through world.reviews, never directly.
 */
export interface SeedReview {
  personId: string;
  stars: number;
  text?: string;
  spoiler?: boolean;
  /** Hours after the release. */
  h: number;
  helpful?: string[];
}

export const SEED_REVIEWS: Record<string, SeedReview[]> = {
  dhoop: [
    { personId: 'vikram', stars: 4.5, h: 30, text: 'Shot almost entirely in available light and it never looks thin. The swimming lessons are the best water work I have seen in a Hindi film.', helpful: ['meera', 'anvi', 'sana', 'teja', 'rhea'] },
    { personId: 'meera', stars: 4, h: 22, text: 'Patient cutting. It trusts silence and lets the sea do the talking.', helpful: ['zoya', 'arjun'] },
    { personId: 'zoya', stars: 4, h: 48, text: 'The last twenty minutes earn every slow scene before them.', helpful: ['meera'] },
    { personId: 'arjun', stars: 3.5, h: 40, spoiler: true, text: 'I did not expect the lighthouse to go dark at the end. The film should have stayed with the granddaughter after that.' },
    { personId: 'anvi', stars: 5, h: 14, text: 'Go for the light. Stay for the grandfather.' },
    { personId: 'rhea', stars: 4.5, h: 52, text: 'Restrained grade, warm skin, cold sea. Beautiful balance.', helpful: ['vikram'] },
    { personId: 'sameer', stars: 4, h: 60 },
    { personId: 'ishaan', stars: 3.5, h: 70, text: 'The house by the sea feels lived in. Some of the town scenes feel like a set.' },
    { personId: 'nandini', stars: 4, h: 76 },
  ],
  ratri: [
    { personId: 'kiran', stars: 4, h: 26, text: 'Lit by tube lights and stage neon, in the rain, all night. Raghu and Priya held focus on a moving band for whole songs. Respect.', helpful: ['sana', 'teja', 'anvi'] },
    { personId: 'tara', stars: 4.5, h: 34, text: 'Five musicians and not one false note. The quiet drummer stays with you.', helpful: ['lakshmi', 'dev'] },
    { personId: 'meera', stars: 3.5, h: 44, text: 'Runs fifteen minutes long, but the middle act is terrific.' },
    { personId: 'sana', stars: 4, h: 20 },
    { personId: 'teja', stars: 4.5, h: 50, text: 'Handheld that never feels lazy.' },
    { personId: 'kabir', stars: 3, h: 66, spoiler: true, text: 'The owner turning out to be the bandleader’s brother was too neat for a film this loose.' },
    { personId: 'nandini', stars: 4, h: 72, text: 'Band uniforms that look slept in, which is the point.' },
  ],
  neeliraat: [
    { personId: 'vikram', stars: 4, h: 400, text: 'Old Hyderabad at 3am has never looked this lonely.', helpful: ['meera', 'rhea'] },
    { personId: 'meera', stars: 4.5, h: 900, text: 'Zoya cuts the hospital corridors like a thriller and the family scenes like a memory.' },
    { personId: 'devika', stars: 4, h: 1300 },
    { personId: 'rhea', stars: 3.5, h: 2000, text: 'Lovely blues, a little crushed in the night exteriors.' },
    { personId: 'tara', stars: 4.5, h: 3100, text: 'Lakshmi Pillai as Sister Mary is the reason to watch.', helpful: ['devika'] },
    { personId: 'nandini', stars: 4, h: 4200 },
  ],
  monsoon: [
    { personId: 'arjun', stars: 5, h: 200, text: 'Devika made a film about letters that feels like one. I wrote to my father after.', helpful: ['tara', 'rhea', 'zoya', 'kabir'] },
    { personId: 'zoya', stars: 4.5, h: 350, text: 'Vikram shoots rain like it is a character. Meera never hurries it.' },
    { personId: 'rhea', stars: 4.5, h: 700, text: 'Greens that feel wet. A colourist’s film.' },
    { personId: 'tara', stars: 4, h: 1100 },
    { personId: 'sana', stars: 4, h: 1500, text: 'Watch it on the biggest screen you can find.' },
    { personId: 'ishaan', stars: 4.5, h: 2300 },
    { personId: 'kabir', stars: 3.5, h: 3000, text: 'Gentle to a fault, but the postman is unforgettable.' },
  ],
  faultlines: [
    { personId: 'meera', stars: 4, h: 300, text: 'Tight episodes. Three to five are the strongest stretch.', helpful: ['zoya'] },
    { personId: 'arjun', stars: 4.5, h: 500, text: 'The city after the quake feels real, not staged. Tara Menon is a find.', helpful: ['devika', 'kabir'] },
    { personId: 'rhea', stars: 3.5, h: 900 },
    { personId: 'devika', stars: 4, h: 1400, text: 'A procedural that cares more about the city than the case.' },
    { personId: 'zoya', stars: 3.5, h: 2100, spoiler: true, text: 'The detective covering for her brother in episode six undoes a lot of what came before.' },
    { personId: 'kabir', stars: 4, h: 2600 },
  ],
};
