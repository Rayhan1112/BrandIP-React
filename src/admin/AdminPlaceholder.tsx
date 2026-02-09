import { useParams } from 'react-router-dom';

export function AdminPlaceholder() {
  const { other } = useParams<{ other: string }>();
  const title = other ? other.replace(/-/g, ' ') : 'Page';
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
      <h2 className="text-2xl font-semibold text-gray-800 capitalize">{title}</h2>
      <p className="text-gray-500 mt-2">This section is coming soon.</p>
    </div>
  );
}
