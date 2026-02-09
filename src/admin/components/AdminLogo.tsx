const BRANDIP_LOGO_URL = 'https://brandip.com/domain-names-for-sale/storage/app/public/channel/1/new-logo.png';

type AdminLogoProps = {
  /** Logo height class (e.g. h-8, h-12) */
  size?: 'sm' | 'md' | 'lg';
  /** Show "BRANDS, IPS AND MORE" tagline below logo */
  showTagline?: boolean;
  /** Center logo (e.g. for login page) */
  center?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: 'h-8 w-[100px]',
  md: 'h-10 w-[120px]',
  lg: 'h-12 w-[180px]',
};

export function AdminLogo({ size = 'md', showTagline = false, center = false, className = '' }: AdminLogoProps) {
  return (
    <div className={className}>
      <img
        src={BRANDIP_LOGO_URL}
        alt="BRANDIP"
        className={`object-contain ${sizeClasses[size]} ${center ? 'mx-auto block' : ''}`}
      />
      {showTagline && (
        <p className="text-base text-gray-500 mt-1">BRANDS, IPS AND MORE</p>
      )}
    </div>
  );
}
