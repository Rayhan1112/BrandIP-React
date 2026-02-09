import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { uploadToCloudinary } from '../../../firebase/cloudinary';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Function to sanitize domain name for use as document ID
const sanitizeDomainName = (domainName: string): string => {
  return domainName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Types for domain
interface Domain {
  id: string;
  domainName: string;
  domainPrice: number;
  discount?: number;
  discountDuration?: string;
  status: 'Active' | 'Pending' | 'Sold';
  logoImage: string;
  mockupImage?: string;
  industryType?: string;
  nameStyle?: string;
  description?: string;
  shortDescription?: string;
  keywords?: string;
  escrowFee?: number;
  brokerageFee?: number;
  possibleUses?: string;
  createdAt: Date;
  userId: string;
  userEmail?: string;
  userName?: string;
}

export function MyDomainsTab() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  
  // Edit mode state
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

  // Fetch user's domains on load
  useEffect(() => {
    const fetchUserDomains = async () => {
      if (!user) {
        setIsFetching(false);
        return;
      }

      try {
        const db = getFirestore();
        const domainsRef = collection(db, 'domains');
        const q = query(domainsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const userDomains: Domain[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userDomains.push({
            id: doc.id,
            domainName: data.domainName || '',
            domainPrice: data.domainPrice || 0,
            discount: data.discount,
            discountDuration: data.discountDuration,
            status: data.status || 'Pending',
            logoImage: data.logoImage || '',
            mockupImage: data.mockupImage,
            industryType: data.industryType,
            nameStyle: data.nameStyle,
            description: data.description,
            shortDescription: data.shortDescription,
            keywords: data.keywords,
            escrowFee: data.escrowFee,
            brokerageFee: data.brokerageFee,
            possibleUses: data.possibleUses,
            createdAt: data.createdAt?.toDate() || new Date(),
            userId: data.userId || '',
          });
        });

        setDomains(userDomains);
      } catch (error) {
        console.error('Error fetching domains:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserDomains();
  }, [user]);
  
  // Form state
  const [formData, setFormData] = useState({
    domainName: '',
    domainPrice: '',
    industryType: '',
    nameStyle: '',
    description: '',
    shortDescription: '',
    keywords: '',
    escrowFee: '',
    brokerageFee: '',
    possibleUses: '',
  });
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [mockupImage, setMockupImage] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [mockupPreview, setMockupPreview] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImage(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleMockupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMockupImage(file);
      setMockupPreview(URL.createObjectURL(file));
    }
  };

  // Open edit form with domain data
  const handleEditClick = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      domainName: domain.domainName,
      domainPrice: domain.domainPrice.toString(),
      industryType: domain.industryType || '',
      nameStyle: domain.nameStyle || '',
      description: domain.description || '',
      shortDescription: domain.shortDescription || '',
      keywords: domain.keywords || '',
      escrowFee: domain.escrowFee?.toString() || '',
      brokerageFee: domain.brokerageFee?.toString() || '',
      possibleUses: domain.possibleUses || '',
    });
    setLogoPreview(domain.logoImage);
    setMockupPreview(domain.mockupImage || '');
    setLogoImage(null);
    setMockupImage(null);
    setShowForm(true);
  };

  // Close edit form
  const closeForm = () => {
    setShowForm(false);
    setEditingDomain(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setMessage('');

    try {
      // Upload images to Cloudinary
      let logoUrl = logoPreview;
      let mockupUrl = mockupPreview;

      if (logoImage) {
        logoUrl = await uploadToCloudinary(logoImage, 'domain-logos');
      }

      if (mockupImage) {
        mockupUrl = await uploadToCloudinary(mockupImage, 'domain-mockups');
      }

      const db = getFirestore();

      if (editingDomain) {
        // Update existing domain
        const domainRef = doc(db, 'domains', editingDomain.id);
        await updateDoc(domainRef, {
          domainName: formData.domainName,
          domainPrice: parseFloat(formData.domainPrice),
          industryType: formData.industryType || '',
          nameStyle: formData.nameStyle || '',
          description: formData.description || '',
          shortDescription: formData.shortDescription || '',
          keywords: formData.keywords || '',
          escrowFee: parseFloat(formData.escrowFee) || 0,
          brokerageFee: parseFloat(formData.brokerageFee) || 0,
          possibleUses: formData.possibleUses || '',
          logoImage: logoUrl,
          mockupImage: mockupUrl || '',
        });

        // Update local state
        setDomains(domains.map(d => 
          d.id === editingDomain.id 
            ? { 
                ...d, 
                domainName: formData.domainName,
                domainPrice: parseFloat(formData.domainPrice),
                industryType: formData.industryType || '',
                nameStyle: formData.nameStyle || '',
                description: formData.description || '',
                shortDescription: formData.shortDescription || '',
                keywords: formData.keywords || '',
                escrowFee: parseFloat(formData.escrowFee) || 0,
                brokerageFee: parseFloat(formData.brokerageFee) || 0,
                possibleUses: formData.possibleUses || '',
                logoImage: logoUrl,
                mockupImage: mockupUrl || '',
              } as Domain
            : d
        ));

        setMessage('Domain updated successfully!');
      } else {
        // Add new domain with domain name as document ID
        const sanitizedDocId = sanitizeDomainName(formData.domainName);
        const newDomain = {
          domainName: formData.domainName,
          domainPrice: parseFloat(formData.domainPrice),
          industryType: formData.industryType || '',
          nameStyle: formData.nameStyle || '',
          description: formData.description || '',
          shortDescription: formData.shortDescription || '',
          keywords: formData.keywords || '',
          escrowFee: parseFloat(formData.escrowFee) || 0,
          brokerageFee: parseFloat(formData.brokerageFee) || 0,
          possibleUses: formData.possibleUses || '',
          logoImage: logoUrl,
          mockupImage: mockupUrl || '',
          status: 'Pending',
          userId: user.uid,
          userEmail: user.email || '',
          userName: user.displayName || '',
          createdAt: new Date(),
        };

        // Use setDoc with sanitized domain name as document ID
        await setDoc(doc(db, 'domains', sanitizedDocId), newDomain);

        // Add to local state
        setDomains([{
          id: sanitizedDocId,
          ...newDomain,
          discount: 0,
          discountDuration: '',
          status: 'Pending' as const,
          createdAt: new Date(),
        } as Domain]);

        setMessage('Domain added successfully!');
      }

      closeForm();
    } catch (error) {
      console.error('Error saving domain:', error);
      setMessage('Failed to save domain. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      domainName: '',
      domainPrice: '',
      industryType: '',
      nameStyle: '',
      description: '',
      shortDescription: '',
      keywords: '',
      escrowFee: '',
      brokerageFee: '',
      possibleUses: '',
    });
    setLogoImage(null);
    setMockupImage(null);
    setLogoPreview('');
    setMockupPreview('');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-[#2c3e50]">My Domains</h2>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-[#3898ec] text-white rounded-lg text-sm font-medium hover:bg-[#2d7bc4] transition-colors"
          >
            Bulk Upload
          </button>
          <button
            type="button"
            onClick={() => { setEditingDomain(null); setShowForm(true); resetForm(); }}
            className="px-4 py-2 bg-[#3898ec] text-white rounded-lg text-sm font-medium hover:bg-[#2d7bc4] transition-colors"
          >
            Add Domain
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-[#d3dce6]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-[#2c3e50]">
              {editingDomain ? 'Edit Domain' : 'Add New Domain'}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Domain Name - Required */}
              <div>
                <label htmlFor="domainName" className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Domain Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="domainName"
                  type="text"
                  required
                  value={formData.domainName}
                  onChange={handleInputChange}
                  placeholder="example.com"
                  className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
                />
              </div>

              {/* Domain Price - Required */}
              <div>
                <label htmlFor="domainPrice" className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Domain Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  id="domainPrice"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.domainPrice}
                  onChange={handleInputChange}
                  placeholder="999.99"
                  className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
                />
              </div>

              {/* Industry Type */}
              <div>
                <label htmlFor="industryType" className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Industry Type
                </label>
                <select
                  id="industryType"
                  value={formData.industryType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
                >
                  <option value="">Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="health">Health</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="sports">Sports</option>
                  <option value="food">Food & Dining</option>
                  <option value="travel">Travel</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Name Style */}
              <div>
                <label htmlFor="nameStyle" className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Name Style
                </label>
                <select
                  id="nameStyle"
                  value={formData.nameStyle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
                >
                  <option value="">Select Style</option>
                  <option value="brandable">Brandable</option>
                  <option value="keyword-rich">Keyword Rich</option>
                  <option value=" acronym">Acronym</option>
                  <option value=" descriptive">Descriptive</option>
                  <option value=" invented">Invented</option>
                  <option value=" compound">Compound</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#6c7a89] mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Full description of the domain..."
                className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
              />
            </div>

            {/* Short Description */}
            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-[#6c7a89] mb-1">
                Short Description
              </label>
              <input
                id="shortDescription"
                type="text"
                maxLength={200}
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="Brief description for cards..."
                className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
              />
            </div>

            {/* Keywords */}
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-[#6c7a89] mb-1">
                Keywords
              </label>
              <input
                id="keywords"
                type="text"
                value={formData.keywords}
                onChange={handleInputChange}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Escrow Fee */}
              <div>
                <label htmlFor="escrowFee" className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Escrow Fee ($)
                </label>
                <input
                  id="escrowFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.escrowFee}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
                />
              </div>

              {/* Brokerage Fee */}
              <div>
                <label htmlFor="brokerageFee" className="block text-sm font-medium text-[#6c7a89] mb-1">
                  Brokerage Fee ($)
                </label>
                <input
                  id="brokerageFee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.brokerageFee}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus- ring-[#3898ec]"
                />
              </div>
            </div>

            {/* Possible Uses */}
            <div>
              <label htmlFor="possibleUses" className="block text-sm font-medium text-[#6c7a89] mb-1">
                Possible Uses
              </label>
              <textarea
                id="possibleUses"
                rows={2}
                value={formData.possibleUses}
                onChange={handleInputChange}
                placeholder="E-commerce, SaaS, Blog, Portfolio..."
                className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
              />
            </div>

            {/* Logo Image */}
            <div>
              <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                Logo Image <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
              />
              {logoPreview && (
                <img src={logoPreview} alt="Logo preview" className="mt-2 h-20 w-auto rounded-lg" />
              )}
            </div>

            {/* Mockup Image */}
            <div>
              <label className="block text-sm font-medium text-[#6c7a89] mb-1">
                Mockup Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleMockupChange}
                className="w-full px-3 py-2 border border-[#d3dce6] rounded-lg text-sm text-[#2c3e50] focus:outline-none focus:ring-2 focus:ring-[#3898ec]"
              />
              {mockupPreview && (
                <img src={mockupPreview} alt="Mockup preview" className="mt-2 h-20 w-auto rounded-lg" />
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 bg-gray-200 text-[#6c7a89] rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 bg-[#3898ec] text-white rounded-lg text-sm font-medium hover:bg-[#2d7bc4] transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Saving...' : editingDomain ? 'Update Domain' : 'Submit Domain'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Domains Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#f5f7fa] text-[#6c7a89] font-medium">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Domain Name</th>
              <th className="px-4 py-3">Domain Price</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Discount Duration</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d3dce6]">
            {isFetching ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#6c7a89]">
                  <div className="py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3898ec] mx-auto"></div>
                    <p className="text-lg mt-4">Loading domains...</p>
                  </div>
                </td>
              </tr>
            ) : domains.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#6c7a89]">
                  <div className="py-4">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <p className="text-lg">No domains yet</p>
                    <p className="text-sm mt-1">Click "Add Domain" to list your first domain</p>
                  </div>
                </td>
              </tr>
            ) : (
              domains.map((domain) => (
                <tr key={domain.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {domain.logoImage && (
                        <img src={domain.logoImage} alt={domain.domainName} className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <span className="font-medium text-[#2c3e50]">{domain.domainName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#2c3e50]">
                    ${domain.domainPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[#2c3e50]">
                    {domain.discount ? `${domain.discount}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-[#6c7a89]">
                    {domain.discountDuration || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      domain.status === 'Active' ? 'bg-green-100 text-green-800' :
                      domain.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {domain.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(domain)}
                        className="text-[#3898ec] hover:text-[#2d7bc4] font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyDomainsTab;
