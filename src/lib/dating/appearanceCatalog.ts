export type AppearanceOption = { slug: string; label: string };

function options(labels: string[]): AppearanceOption[] {
  return labels.map((label) => ({
    label,
    slug: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
  }));
}

/** Gray and grey share this slug. */
export const GRAY_SLUG = 'gray';

export const EYE_COLOR_OPTIONS = options([
  'Brown',
  'Dark brown',
  'Light brown',
  'Hazel',
  'Amber',
  'Green',
  'Dark green',
  'Blue',
  'Light blue',
  'Gray',
  'Blue-gray',
  'Green-gray',
  'Violet',
  'Heterochromia',
]);

export const HAIR_COLOR_OPTIONS = options([
  'Black',
  'Dark brown',
  'Brown',
  'Light brown',
  'Blonde',
  'Dirty blonde',
  'Platinum',
  'Strawberry blonde',
  'Auburn',
  'Red',
  'Ginger',
  'Gray',
  'Silver',
  'White',
  'Highlighted',
  'Balayage',
  'Ombre',
  'Dyed',
  'Multicolor',
  'Bald',
]);

export const HAIR_STYLE_OPTIONS = options([
  'Long',
  'Shoulder length',
  'Lob',
  'Bob',
  'Pixie',
  'Shag',
  'Layers',
  'Bangs',
  'Curtain bangs',
  'Middle part',
  'Side part',
  'Ponytail',
  'Bun',
  'Braids',
  'Locs',
  'Twists',
  'Cornrows',
  'Afro',
  'Curls',
  'Coils',
  'Waves',
  'Straight',
  'Updo',
  'Buzz cut',
  'Crew cut',
  'Fade',
  'High fade',
  'Low fade',
  'Undercut',
  'Pompadour',
  'Quiff',
  'Slicked back',
  'Man bun',
  'Mullet',
  'Mohawk',
  'Caesar',
  'French crop',
  'Textured crop',
  'Shaved',
]);

export const FACIAL_HAIR_OPTIONS = options([
  'Clean shaven',
  'Stubble',
  'Mustache',
  'Beard',
  'Full beard',
  'Short beard',
  'Goatee',
  'Van dyke',
  'Soul patch',
]);

export const APPEARANCE_OPTIONS = options([
  'Active',
  'Outdoors',
  'Rugged',
  'Baby doll',
  'Athletic',
  'Classic',
  'Polished',
  'Soft',
  'Glam',
  'Edgy',
  'Preppy',
  'Street',
  'Ranch',
  'Formal',
  'Minimal',
  'Bohemian',
  'Professional',
  'Vintage',
  'Modest',
  'Traditional',
  'Hip hop',
  'Rock',
  'Goth',
  'Romantic',
  'Dapper',
  'Artistic',
  'Coastal',
  'Tomboy',
  'Suave',
]);

/** Not shown on Filters. Used later to choose an appearance id. */
export const CLOTHING_OPTIONS = options([
  'Casual',
  'Classic',
  'Polished',
  'Streetwear',
  'Athletic wear',
  'Ranch wear',
  'Formal',
  'Vintage',
  'Minimal',
  'Glam',
  'Bohemian',
  'Preppy',
  'Edgy',
  'Professional',
  'Soft',
  'Baby doll',
]);

/** Not shown on Filters. Used later to choose an appearance id. */
export const SETTING_OPTIONS = options([
  'Winter sports',
  'Beach',
  'Gym',
  'Hiking',
  'Running',
  'Cycling',
  'Yoga',
  'Court sports',
  'Water sports',
  'Outdoors',
  'Nightlife',
  'City',
  'Home',
  'Travel',
  'Dining',
  'Concert',
  'Ranch',
  'Office',
]);

export const ADVANCED_FILTER_GROUPS = [
  { key: 'eyeColor', title: 'Eye color', options: EYE_COLOR_OPTIONS },
  { key: 'hairColor', title: 'Hair color', options: HAIR_COLOR_OPTIONS },
  { key: 'hairStyle', title: 'Haircut', options: HAIR_STYLE_OPTIONS },
  { key: 'facialHair', title: 'Facial hair', options: FACIAL_HAIR_OPTIONS },
  { key: 'appearance', title: 'Appearance', options: APPEARANCE_OPTIONS },
] as const;

export type AdvancedFilterKey = (typeof ADVANCED_FILTER_GROUPS)[number]['key'];

export type AdvancedFilterSelection = Record<AdvancedFilterKey, string[]>;

export function emptyAdvancedFilters(): AdvancedFilterSelection {
  return {
    eyeColor: [],
    hairColor: [],
    hairStyle: [],
    facialHair: [],
    appearance: [],
  };
}

export function toggleAdvancedSlug(
  current: AdvancedFilterSelection,
  key: AdvancedFilterKey,
  slug: string,
): AdvancedFilterSelection {
  const selected = current[key];
  return {
    ...current,
    [key]: selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug],
  };
}
