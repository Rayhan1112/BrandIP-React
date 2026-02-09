export const WIZARD_STEPS = [
  { id: 1, label: 'SELECT BRANDING TYPE' },
  { id: 2, label: 'BRIEF ABOUT YOUR BRAND' },
  { id: 3, label: 'SELECT A PACKAGE' },
  { id: 4, label: 'MAKE PAYMENT' },
];

export type BrandingTypeCard = {
  id: string;
  number: number;
  title: string;
  description: string;
};

export const BASIC_TYPES: BrandingTypeCard[] = [
  {
    id: 'name',
    number: 1,
    title: 'Name',
    description: 'Pick the best name from our comprehensive and unique list.',
  },
  {
    id: 'logo',
    number: 2,
    title: 'Logo',
    description: 'Your logo reflects what you do. Choose one that comprehensively defines your business.',
  },
  {
    id: 'tagline',
    number: 3,
    title: 'Tagline or Slogan',
    description: "Taglines are timeless, and as they represent the overall brand, it's crucial to choose the right one.",
  },
];

export const COMBO_PACKAGES: BrandingTypeCard[] = [
  {
    id: 'logo-tagline',
    number: 4,
    title: 'Logo + Tagline',
    description: 'A logo represents your business, and taglines leave a lasting impression. Both can be obtained from our budget-friendly packages.',
  },
  {
    id: 'name-tagline',
    number: 5,
    title: 'Name + Tagline',
    description: 'Having a memorable name is essential. Our competitive combo packages save you time and effort.',
  },
  {
    id: 'name-logo',
    number: 6,
    title: 'Name + Logo',
    description: 'An unique name makes an impeccable impression. Choose from our cost-effective plans to maintain that image.',
  },
  {
    id: 'name-logo-tagline',
    number: 7,
    title: 'Name + Logo + Tagline',
    description: 'Our cost-effective packages offer a combination of logo, unique name, and relatable tagline for your business.',
  },
  {
    id: 'name-logo-businesscard',
    number: 8,
    title: 'Name + Logo + Business Card',
    description: 'An appealing name, a presentable logo, and a concise introduction of your business make your brand stand out. Choose the combination that best defines you and your business.',
  },
  {
    id: 'logo-businesscard',
    number: 9,
    title: 'Logo + Business Card',
    description: 'An all-in-one solution keeps your business intact, and our plans can help you achieve just that.',
  },
  {
    id: 'logo-businesscard-stationary',
    number: 10,
    title: 'Logo + Business card + Stationary',
    description: 'A proper business presentation and a fully-fledged inventory can help boost your business. Choose the right and budget-friendly plans to make it happen.',
  },
];

export const ADDITIONAL_TYPES: BrandingTypeCard[] = [
  {
    id: 'business-card',
    number: 11,
    title: 'Business Card',
    description: 'Represent your business uniquely at an affordable price.',
  },
  {
    id: 'stationary',
    number: 12,
    title: 'Stationary Type',
    description: 'Never run short of the required inventory for your business; we provide them at pocket-friendly prices.',
  },
  {
    id: 'product-research-poc',
    number: 13,
    title: 'Product Research and POC',
    description: 'Benefit from proper research methodology conducted by experts for your brand and business.',
  },
];

const ALL_BRANDING_CARDS = [...BASIC_TYPES, ...COMBO_PACKAGES, ...ADDITIONAL_TYPES];

export function getBrandingTypeTitle(id: string | null): string {
  if (!id) return '';
  const card = ALL_BRANDING_CARDS.find((c) => c.id === id);
  return card?.title ?? id;
}
