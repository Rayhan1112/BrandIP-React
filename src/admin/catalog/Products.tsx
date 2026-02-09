import { useEffect, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { syncAllProductsFromMysqlToFirestore, type ProductSyncResult } from '../../services/productSyncService';

interface Domain {
  id: string;
  domainName?: string;
  name?: string;
  price?: number;
  category?: string;
  status?: string;
  sellerId?: string;
  createdAt?: Date;
  domainLength?: number;
  extension?: string;
  [key: string]: unknown;
}

export function AdminProducts() {
  const [products, setProducts] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<ProductSyncResult | null>(null);

  const handleSyncFromMysql = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAllProductsFromMysqlToFirestore();
      setSyncResult(result);
    } catch (err) {
      setSyncResult({
        success: false,
        totalFetched: 0,
        totalWritten: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      if (!db) {
        console.error('Firestore not initialized');
        setError('Firestore not initialized');
        setLoading(false);
        return;
      }

      console.log('Fetching products from Firestore...');
      
      // Fetch all domains without ordering to avoid index issues
      const q = query(collection(db, 'domains'));
      const querySnapshot = await getDocs(q);

      console.log(`Found ${querySnapshot.docs.length} documents`);

      const productsData: Domain[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || data.createdAt || new Date(),
        };
      });

      setProducts(productsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const name = product.domainName || product.name || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | undefined) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price || 0);
  };

  const getStatusBadge = (status: string | undefined) => {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Sold: 'bg-blue-100 text-blue-800',
    };
    return colors[status || ''] || 'bg-gray-100 text-gray-800';
  };

  const getDomainName = (product: Domain) => {
    return product.domainName || product.name || 'Unnamed Domain';
  };

  return (
    <div className="space-y-6 w-full">
      {/* Sync MySQL → Firestore (product_flat) */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Sync products from MySQL to Firestore</h2>
        <p className="text-sm text-gray-600 mb-3">
          Fetches all products from the PHP API (MySQL <code className="bg-gray-100 px-1 rounded">product_flat</code>) and stores them in Firestore under the <code className="bg-gray-100 px-1 rounded">product_flat</code> collection. Requires PHP API running and admin login.
        </p>
        <button
          type="button"
          onClick={handleSyncFromMysql}
          disabled={syncing}
          className="px-4 py-2 bg-[#3898ec] text-white rounded-lg hover:bg-[#2d7bc4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? 'Syncing…' : 'Sync products from MySQL'}
        </button>
        {syncResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${syncResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {syncResult.success ? (
              <p>Done. Fetched {syncResult.totalFetched}, written to Firestore: {syncResult.totalWritten}.</p>
            ) : (
              <div>
                <p>Sync had issues: {syncResult.totalWritten} written, {syncResult.errors.length} error(s).</p>
                {syncResult.errors.length > 0 && (
                  <ul className="mt-1 list-disc list-inside">{syncResult.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <button className="px-4 py-2 bg-[#3898ec] text-white rounded-lg hover:bg-[#2d7bc4] transition-colors">
            Add New Product
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={fetchProducts}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Sold">Sold</option>
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3898ec] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {products.length === 0 
                  ? 'No products found in the database.' 
                  : 'No products match your search criteria.'}
              </p>
              <button 
                onClick={fetchProducts}
                className="px-4 py-2 bg-[#3898ec] text-white rounded-lg hover:bg-[#2d7bc4] transition-colors"
              >
                Refresh
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getDomainName(product)}</div>
                      {product.extension && (
                        <div className="text-xs text-gray-500">.{product.extension}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(product.status)}`}>
                        {product.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-[#3898ec] hover:text-[#2d7bc4] mr-3">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredProducts.length} of {products.length} products
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
