import { WIZARD_STEPS } from './brandingConstants';

function TickIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

export function OrderProgressTracker({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full flex flex-wrap gap-2 sm:gap-3 mb-8">
      {WIZARD_STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        return (
          <div
            key={step.id}
            className={`flex-1 min-w-[120px] sm:min-w-0 py-3 px-2 sm:px-4 rounded-lg text-center text-xs sm:text-sm font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5 ${
              isActive || isCompleted
                ? 'bg-brandip-accent text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {isCompleted ? (
              <>
                <TickIcon className="w-5 h-5 shrink-0" />
                <span>{step.label}</span>
              </>
            ) : (
              <>
                {step.id}. {step.label}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
