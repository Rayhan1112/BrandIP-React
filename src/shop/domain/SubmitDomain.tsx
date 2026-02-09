import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitDomainRequest } from '../../services/domainService';

const industries = [
  'Technology',
  'Health & Fitness',
  'Finance & Business',
  'E-commerce',
  'Education',
  'Entertainment',
  'Travel & Tourism',
  'Food & Dining',
  'Real Estate',
  'Sports',
  'Fashion & Beauty',
  'Other',
];

const extensions = ['.com', '.ai', '.io', '.co', '.net', '.org', '.app', '.xyz'];

export function SubmitDomain() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    domainName: '',
    domainPrice: '',
    extension: '.com',
    industryType: '',
    shortDescription: '',
    description: '',
    keywords: '',
    logoImage: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin', { state: { from: '/submit-domain' } });
      return;
    }

    setSubmitting(true);
    
    const result = await submitDomainRequest({
      domainName: formData.domainName + formData.extension,
      domainPrice: parseFloat(formData.domainPrice),
      industryType: formData.industryType,
      shortDescription: formData.shortDescription,
      description: formData.description,
      keywords: formData.keywords,
      logoImage: formData.logoImage,
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || '',
    });

    setSubmitting(false);
    
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Domain Submitted!</h2>
          <p className="mt-2 text-gray-600">Your domain request has been submitted for review. You will be notified once it's approved.</p>
          <p className="mt-4 text-sm text-gray-500">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit a Domain</h1>
          <p className="mt-2 text-gray-600">List your domain for sale on BrandIP</p>
        </div>

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Please <a href="/signin" className="font-medium underline">sign in</a> to submit a domain.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="domainName" className="block text-sm font-medium text-gray-700">
                Domain Name
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="domainName"
                  name="domainName"
                  required
                  value={formData.domainName}
                  onChange={handleChange}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="example"
                />
                <select
                  name="extension"
                  value={formData.extension}
                  onChange={handleChange}
                  className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                >
                  {extensions.map(ext => (
                    <option key={ext} value={ext}>{ext}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="domainPrice" className="block text-sm font-medium text-gray-700">
                Asking Price (USD)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="domainPrice"
                  name="domainPrice"
                  required
                  min="1"
                  value={formData.domainPrice}
                  onChange={handleChange}
                  className="flex-1 block w-full px-3 pl-7 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="industryType" className="block text-sm font-medium text-gray-700">
              Industry Category
            </label>
            <select
              id="industryType"
              name="industryType"
              required
              value={formData.industryType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select an industry</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700">
              Short Description
            </label>
            <input
              type="text"
              id="shortDescription"
              name="shortDescription"
              maxLength={100}
              value={formData.shortDescription}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Brief tagline for your domain"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Full Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Describe your domain and its potential uses..."
            />
          </div>

          <div>
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              id="keywords"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="tech, ai, startup, software"
            />
          </div>

          <div>
            <label htmlFor="logoImage" className="block text-sm font-medium text-gray-700">
              Logo URL (optional)
            </label>
            <input
              type="url"
              id="logoImage"
              name="logoImage"
              value={formData.logoImage}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || !user}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Domain'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
