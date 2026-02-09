type AdminButtonProps = {
  type?: 'button' | 'submit';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

const baseClass =
  'w-full py-2.5 bg-[#3898ec] hover:bg-[#2d7bc4] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export function AdminButton({
  type = 'button',
  children,
  onClick,
  className = '',
  disabled,
}: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClass} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
