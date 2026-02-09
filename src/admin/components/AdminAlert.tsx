type AdminAlertProps = {
  message: string;
  variant?: 'error' | 'info';
};

export function AdminAlert({ message, variant = 'error' }: AdminAlertProps) {
  const classes =
    variant === 'error'
      ? 'text-base text-red-600 bg-red-50 px-3 py-2 rounded-lg'
      : 'text-base text-blue-600 bg-blue-50 px-3 py-2 rounded-lg';

  return <p className={classes}>{message}</p>;
}
