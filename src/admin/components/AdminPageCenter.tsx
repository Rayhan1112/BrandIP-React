type AdminPageCenterProps = {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
};

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function AdminPageCenter({
  children,
  maxWidth = 'md',
  className = '',
}: AdminPageCenterProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-[#f0f2f5] ${className}`}>
      <div className={`w-full ${maxWidthClasses[maxWidth]}`}>{children}</div>
    </div>
  );
}
