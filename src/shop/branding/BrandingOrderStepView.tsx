import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BrandingOrderIntro } from './BrandingOrderIntro';
import { OrderProgressTracker } from './OrderProgressTracker';
import { BrandingStep1 } from './BrandingStep1';
import { BrandingStep2 } from './BrandingStep2';
import { BrandingStep3 } from './BrandingStep3';
import { BrandingStep4 } from './BrandingStep4';

export function BrandingOrderStepView() {
  const { step: stepParam } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentStep = Math.min(4, Math.max(1, parseInt(stepParam ?? '1', 10) || 1));
  const selectedBrandingType = (location.state as { selectedBrandingType?: string } | null)?.selectedBrandingType ?? null;

  if (stepParam !== String(currentStep)) {
    return <Navigate to={`/branding/order/${currentStep}`} replace />;
  }

  const state = location.state as { selectedBrandingType?: string } | null;

  return (
    <div className="min-h-screen">
      <BrandingOrderIntro />
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <OrderProgressTracker currentStep={currentStep} />
        {currentStep === 1 && (
          <BrandingStep1
            onSelect={(id) => navigate('/branding/order/2', { state: { selectedBrandingType: id } })}
          />
        )}
        {currentStep === 2 && (
          <BrandingStep2
            selectedType={selectedBrandingType}
            onBack={() => navigate('/branding/order/1')}
            onNext={() => navigate('/branding/order/3', { state: state ?? {} })}
          />
        )}
        {currentStep === 3 && (
          <BrandingStep3
            onBack={() => navigate('/branding/order/2', { state: state ?? {} })}
            onNext={() => navigate('/branding/order/4', { state: state ?? {} })}
          />
        )}
        {currentStep === 4 && (
          <BrandingStep4 onBack={() => navigate('/branding/order/3', { state: state ?? {} })} />
        )}
      </div>
    </div>
  );
}
