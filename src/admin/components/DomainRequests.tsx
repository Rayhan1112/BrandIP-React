import { useState, useEffect } from 'react';
import { fetchDomainsByStatus, approveDomain, rejectDomain, fetchUserById, type Domain } from '../../services/domainService';

interface DomainWithUser extends Domain {
  userEmail?: string;
  userName?: string;
}

export function DomainRequests() {
  const [pendingDomains, setPendingDomains] = useState<DomainWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingDomains();
  }, []);

  const loadPendingDomains = async () => {
    setLoading(true);
    const domains = await fetchDomainsByStatus('Pending');
    
    // Fetch user details for each domain
    const domainsWithUsers = await Promise.all(
      domains.map(async (domain) => {
        let userEmail = '';
        let userName = '';
        
        if (domain.userEmail) {
          userEmail = domain.userEmail;
        } else if (domain.userId) {
          // Try to fetch from users collection
          const user = await fetchUserById(domain.userId);
          if (user) {
            userEmail = user.email;
            userName = user.displayName || '';
          }
        }
        
        return {
          ...domain,
          userEmail,
          userName,
        };
      })
    );
    
    setPendingDomains(domainsWithUsers);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const success = await approveDomain(id);
    if (success) {
      setPendingDomains(prev => prev.filter(d => d.id !== id));
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const success = await rejectDomain(id);
    if (success) {
      setPendingDomains(prev => prev.filter(d => d.id !== id));
    }
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Domain Requests</h2>
        <span className="text-sm text-gray-500">{pendingDomains.length} pending requests</span>
      </div>

      {pendingDomains.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
          <p className="mt-1 text-sm text-gray-500">All domain requests have been processed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingDomains.map((domain) => (
                <tr key={domain.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {domain.logoImage && (
                        <img src={domain.logoImage} alt="" className="h-10 w-10 rounded-lg object-cover mr-3" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{domain.domainName}</div>
                        {domain.shortDescription && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{domain.shortDescription}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{domain.userName || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{domain.userEmail || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${domain.domainPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {domain.industryType || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {domain.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleApprove(domain.id)}
                      disabled={processing === domain.id}
                      className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50"
                    >
                      {processing === domain.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(domain.id)}
                      disabled={processing === domain.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
