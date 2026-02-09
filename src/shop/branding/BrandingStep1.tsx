import type { BrandingTypeCard } from './brandingConstants';
import { BASIC_TYPES, COMBO_PACKAGES, ADDITIONAL_TYPES } from './brandingConstants';

function BrandingTypeCardItem({
  card,
  onSelect,
}: {
  card: BrandingTypeCard;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left bg-gray-100 rounded-[10px] p-5 sm:p-6 hover:bg-gray-200 hover:ring-2 hover:ring-brandip-accent transition-all focus:outline-none focus:ring-2 focus:ring-brandip-accent"
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-[#1A1A1A] font-bold text-sm mb-3">
        {card.number}
      </span>
      <h3 className="text-[18px] sm:text-[20px] font-bold text-[#1A1A1A] mb-2">
        {card.title}
      </h3>
      <p className="text-[15px] sm:text-[16px] text-[#555555] leading-snug">
        {card.description}
      </p>
    </button>
  );
}

export function BrandingStep1({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <>
      <h2 className="text-[28px] sm:text-[32px] font-bold text-[#1A1A1A] text-center mb-2">
        STEP 1 - Select Branding Type
      </h2>
      <p className="text-[16px] sm:text-[18px] text-[#555555] text-center mb-10 max-w-[800px] mx-auto leading-snug">
        Pick From Our Most Popular Categories, Launch A Project And Begin Receiving Submissions Right Away
      </p>

      <div className="space-y-10">
        <div>
          <h3 className="text-[20px] font-bold text-[#1A1A1A] mb-4">
            Select from our basic types
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BASIC_TYPES.map((card) => (
              <BrandingTypeCardItem
                key={card.id}
                card={card}
                onSelect={() => onSelect(card.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[20px] font-bold text-[#1A1A1A] mb-4">
            Save With Our Combo Packages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COMBO_PACKAGES.map((card) => (
              <BrandingTypeCardItem
                key={card.id}
                card={card}
                onSelect={() => onSelect(card.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[20px] font-bold text-[#1A1A1A] mb-4">
            Additional ways to build Your Brand
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ADDITIONAL_TYPES.map((card) => (
              <BrandingTypeCardItem
                key={card.id}
                card={card}
                onSelect={() => onSelect(card.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
