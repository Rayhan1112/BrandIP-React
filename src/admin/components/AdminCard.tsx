type AdminCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function AdminCard({ children, className = '' }: AdminCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 ${className}`}>
      {children}
    </div>
  );
}
