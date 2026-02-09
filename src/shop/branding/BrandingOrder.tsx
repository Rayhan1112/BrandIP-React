import { Link } from 'react-router-dom';
import { BrandingOrderIntro } from './BrandingOrderIntro';
import { ProjectsDone, type ProjectItem } from './ProjectsDone';

const LANDING_STEPS = [
  {
    title: 'Step 1: Choose a Branding Type.',
    description:
      'Select your preferred branding type from options such as budget-friendly basic plans, cost-saving combo plans, or additional services.',
  },
  {
    title: 'Step 2: Tell Us About Your Business.',
    description:
      'Provide a brief description of your business, its purpose, and your target audience.',
  },
  {
    title: 'Step 3: Select a Package.',
    description:
      'Pick from our affordable packages, starting with the Pink Tulip plan and up to the premium Blue Tulip package.',
  },
  {
    title: 'Step 4. Complete Your Transaction.',
    description:
      'Make the payment through a secure channel to complete your purchase.',
  },
];

const projectsDone: ProjectItem[] = [
  {
    id: '1',
    title: 'Paybash Mobile App',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=450&fit=crop',
  },
  {
    id: '2',
    title: 'BuiltEz App',
    image: 'https://images.unsplash.com/photo-1586717799252-2d1c373c5d97?w=600&h=450&fit=crop',
  },
  {
    id: '3',
    title: 'TossZone',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=450&fit=crop',
  },
  {
    id: '4',
    title: 'Analysis Studio App',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=450&fit=crop',
  },
];

export function BrandingOrder() {
  return (
    <div className="min-h-screen">
      <BrandingOrderIntro />
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="text-center mb-8 sm:mb-10">
          <Link
            to="/branding/order/1"
            className="inline-block px-5 py-2 rounded-lg bg-brandip-accent hover:opacity-90 text-white font-semibold text-[15px] uppercase tracking-wide transition-colors"
          >
            START AN ORDER
          </Link>
        </div>
        <h2 className="text-[34px] sm:text-[38px] font-bold text-[#1A1A1A] text-center mb-10 sm:mb-12">
          Complete Your Branding Order in 4 Simple Steps
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12 sm:mb-16">
          {LANDING_STEPS.map((step) => (
            <div
              key={step.title}
              className="bg-gray-100 rounded-[10px] p-5 sm:p-6 text-left"
            >
              <h3 className="text-[20px] sm:text-[22px] font-bold text-[#1A1A1A] mb-3">
                {step.title}
              </h3>
              <p className="text-[16px] sm:text-[18px] text-[#555555] leading-snug">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        <ProjectsDone title="Projects Done" projects={projectsDone} />
      </div>
    </div>
  );
}
