import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDomainById, type Domain } from '../../services/domainService';
import { fetchProductById, type ProductWithImageUrl } from '../../services/phpApiService';
import { ShimmerDetails } from '../../components/Shimmer';

/** Normalized shape for DomainDetails so we can render from Laravel product or Firebase domain. */
type DetailsData = {
  displayName: string;
  price: string;
  hasPrice: boolean;
  galleryImages: string[];
  aboutText: string;
  shortDesc: string;
};

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop';

function productToDetailsData(p: ProductWithImageUrl): DetailsData {
  const displayName = p.name ?? p.sku ?? p.url_key ?? `Product ${p.id}`;
  const priceVal = p.special_price != null && p.special_price > 0 ? p.special_price : p.price;
  const hasPrice = priceVal != null && Number(priceVal) > 0;
  const price = hasPrice ? `$${Number(priceVal).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0';
  const galleryImages =
    p.image_urls && p.image_urls.length > 0
      ? p.image_urls
      : p.image_url
        ? [p.image_url]
        : [PLACEHOLDER_IMAGE];
  return {
    displayName,
    price,
    hasPrice,
    galleryImages,
    aboutText: p.description || defaultAbout,
    shortDesc: p.short_description || defaultGalleryCaption,
  };
}

function domainToDetailsData(d: Domain): DetailsData {
  const hasPrice = d.domainPrice != null && d.domainPrice > 0;
  const images: string[] = [];
  if (d.logoImage) images.push(d.logoImage);
  if (d.mockupImage && d.mockupImage !== d.logoImage) images.push(d.mockupImage);
  return {
    displayName: d.domainName,
    price: hasPrice ? `$${d.domainPrice.toLocaleString()}` : '$0',
    hasPrice,
    galleryImages: images.length ? images : [PLACEHOLDER_IMAGE],
    aboutText: d.description || defaultAbout,
    shortDesc: d.shortDescription || defaultGalleryCaption,
  };
}

// Fallback data when domain is not found or for demo (e.g. ohr.com)
const defaultAbout = `This domain presents a dynamic platform for businesses in audio technology, sound engineering, and music production. It can serve as a community hub for musicians and audio professionals.`;

const defaultPossibleUses = [
  { industry: 'Music, Audio, Video', use: 'Launch an online platform for independent musicians.' },
  { industry: 'Media & Communication', use: 'Develop a podcast production service.' },
  { industry: 'Professional Services', use: 'Provide consulting services to enhance audio branding.' },
  { industry: 'Education & Training', use: 'Create an online learning platform focusing on audio engineering.' },
  { industry: 'Event Planning & Services', use: 'Organize and host music events, workshops, and seminars.' },
];

const defaultIndustries = [
  'Entrepreneur, Business', 'Telecom', 'Innovation & Creativity', 'Music, Audio, Video',
  'Media & Communication', 'Professional Services', 'Education & Training', 'Social & Networking',
  'Event Planning & Services', 'Sales, Marketing & Advertising', 'Health & Wellness', 'Sustainability',
];

const defaultWhatsNext = [
  'Checkout Securely: We accept major credit cards, Bitcoin, or wire transfers.',
  'Follow Transfer Instructions: An agent will contact you with personalized information.',
  'Confirm Delivery: Payment is held in escrow until you receive the name.',
];

const whatsIncludedItems = [
  { title: 'A Premium Domain Name', desc: 'Brandip names are curated by branding experts.' },
  { title: 'Professionally Designed Logo', desc: 'A creative logo created by a highly skilled logo designer.' },
  { title: 'Transparent Pricing', desc: 'No hidden fees, no escrow fees. Guaranteed delivery.' },
];

const defaultGalleryCaption = 'Designing and developing innovative websites and digital platforms that drive user engagement and deliver exceptional user experiences.';

export function DomainDetails() {
  const { id } = useParams<{ id: string }>();
  const [details, setDetails] = useState<DetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [purchaseOption, setPurchaseOption] = useState<'buy' | 'offer'>('buy');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    offer: '',
    agreeCriteria: false,
    consentSms: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setDetails(null);
    (async () => {
      try {
        // Prefer Laravel product (homepage domain cards use product id)
        const product = await fetchProductById(id, abortRef.current?.signal ?? undefined);
        if (product) {
          setDetails(productToDetailsData(product));
          if (!(product.special_price != null && product.special_price > 0) && !(product.price != null && product.price > 0)) {
            setPurchaseOption('offer');
          }
          setLoading(false);
          return;
        }
        // Fallback: Firebase domain (legacy ids like mydomain-com)
        const domain = await fetchDomainById(id);
        if (domain) {
          setDetails(domainToDetailsData(domain));
          const hasPrice = domain.domainPrice != null && domain.domainPrice > 0;
          if (!hasPrice) setPurchaseOption('offer');
        }
      } catch (_) {
        if ((_ as Error).name !== 'AbortError') setDetails(null);
      } finally {
        setLoading(false);
      }
    })();
    return () => { abortRef.current?.abort(); };
  }, [id]);

  if (loading) {
    return <ShimmerDetails />;
  }

  if (id && !details) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-bold text-[#1A1A1A]">Domain not found</h1>
        <Link to="/" className="text-[#3898ec] hover:underline">Back to home</Link>
      </div>
    );
  }

  const { displayName, price, hasPrice, galleryImages, aboutText, shortDesc } = details!;
  const mainImage = galleryImages[selectedImageIndex] ?? galleryImages[0];
  const showOfferForm = !hasPrice || purchaseOption === 'offer';

  return (
    <div className="min-h-screen">
      {/* Hero: same pattern as Branding Order / Homepage – body gradient shows through */}
      <section className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8 sm:pb-12 text-center">
        <h1 className="text-[34px] sm:text-[40px] md:text-[44px] font-bold text-[#1A1A1A] mb-2 leading-none">
          The Domain Name <span className="font-bold">{displayName}</span> Is For Sale
        </h1>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left column: content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image gallery */}
            <section>
              <div className="flex gap-4">
                <div className="flex-1 rounded-xl overflow-hidden bg-gray-100 aspect-[4/3]">
                  <img
                    src={mainImage}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-2 w-20 shrink-0">
                  {galleryImages.slice(0, 5).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedImageIndex(i)}
                      className={`rounded-lg overflow-hidden aspect-square bg-gray-100 border-2 ${
                        selectedImageIndex === i ? 'border-[#3898ec]' : 'border-transparent'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-base text-[#555] mt-3 leading-snug">{shortDesc}</p>
              <div className="flex gap-1.5 mt-2">
                {galleryImages.map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block w-2 h-2 rounded-full ${
                      i === selectedImageIndex ? 'bg-[#2c3e50]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </section>

            {/* About */}
            <section>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">About {displayName}</h2>
              <p className="text-base text-[#555] leading-snug">{aboutText}</p>
            </section>

            {/* Possible uses */}
            <section>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">Possible Uses for the Top 5 Industries:</h2>
              <ul className="list-disc list-inside space-y-2 text-base text-[#555]">
                {defaultPossibleUses.map((item) => (
                  <li key={item.industry}>
                    <span className="font-medium text-[#1A1A1A]">{item.industry}:</span> {item.use}
                  </li>
                ))}
              </ul>
            </section>

            {/* Industries tags */}
            <section>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">Industries</h2>
              <div className="flex flex-wrap gap-2">
                {defaultIndustries.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-lg bg-[#2c3e50] text-white text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* What's next */}
            <section>
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">What&apos;s Next?</h2>
              <ul className="list-disc list-inside space-y-2 text-base text-[#555]">
                {defaultWhatsNext.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right column: purchase options & sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A]">Interested in this domain?</h2>
                <p className="text-lg font-bold text-[#1A1A1A] mt-1">{displayName}</p>
              </div>

              {/* Purchase options: Buy Domain (only if has price) / Make an Offer */}
              <div className="space-y-3">
                {hasPrice && (
                  <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-[#d3dce6] p-4 hover:bg-gray-50/50">
                    <input
                      type="radio"
                      name="purchase"
                      checked={purchaseOption === 'buy'}
                      onChange={() => setPurchaseOption('buy')}
                      className="mt-1 text-[#3898ec]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[#1A1A1A]">Buy Domain</span>
                        <span className="font-bold text-red-600">{price}</span>
                      </div>
                      <p className="text-sm text-[#555] mt-1">Pay a fixed amount, get complete ownership of this domain.</p>
                    </div>
                  </label>
                )}
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-[#d3dce6] p-4 hover:bg-gray-50/50">
                  <input
                    type="radio"
                    name="purchase"
                    checked={purchaseOption === 'offer'}
                    onChange={() => setPurchaseOption('offer')}
                    className="mt-1 text-[#3898ec]"
                  />
                  <span className="font-medium text-[#1A1A1A]">Make an Offer</span>
                </label>

                {/* Make an Offer form – expanded when "Make an Offer" selected or when domain has no price */}
                {showOfferForm && (
                  <div className="rounded-xl border border-[#d3dce6] bg-gray-50/50 p-5 mt-3">
                    <form
                      onSubmit={(e) => e.preventDefault()}
                      className="space-y-3"
                    >
                      <input
                        type="text"
                        placeholder="First Name*"
                        value={formData.firstName}
                        onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[#1A1A1A] placeholder:text-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Last Name*"
                        value={formData.lastName}
                        onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[#1A1A1A] placeholder:text-gray-500"
                      />
                      <input
                        type="tel"
                        placeholder="Phone*"
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[#1A1A1A] placeholder:text-gray-500"
                      />
                      <input
                        type="email"
                        placeholder="Email*"
                        value={formData.email}
                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[#1A1A1A] placeholder:text-gray-500"
                      />
                      <input
                        type="text"
                        placeholder="Your Best Offer*"
                        value={formData.offer}
                        onChange={(e) => setFormData((p) => ({ ...p, offer: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-[#1A1A1A] placeholder:text-gray-500"
                      />
                      <p className="text-sm text-[#555] leading-snug">
                        We only consider serious, well-informed domain buyers. Please read the submission criteria below.
                      </p>
                      <ul className="list-disc list-inside text-sm text-[#555] space-y-1">
                        <li><strong>Valuation:</strong> We do not respond to submissions including low offers.</li>
                        <li><strong>Proof of Funds:</strong> A bank reference letter or verifiable phone number is required.</li>
                        <li><strong>True Identity Policy (No Middleman):</strong> Submissions involving brokers or intermediaries will not be accepted.</li>
                      </ul>
                      <label className="flex items-start gap-2 text-sm text-[#555]">
                        <input
                          type="checkbox"
                          checked={formData.agreeCriteria}
                          onChange={(e) => setFormData((p) => ({ ...p, agreeCriteria: e.target.checked }))}
                          className="mt-1 rounded border-gray-300 text-[#3898ec]"
                        />
                        <span>I acknowledge and agree to the submission criteria outlined above.</span>
                      </label>
                      <label className="flex items-start gap-2 text-sm text-[#555]">
                        <input
                          type="checkbox"
                          checked={formData.consentSms}
                          onChange={(e) => setFormData((p) => ({ ...p, consentSms: e.target.checked }))}
                          className="mt-1 rounded border-gray-300 text-[#3898ec]"
                        />
                        <span>I consent to receive SMS text messages from BrandIP.</span>
                      </label>
                      <div className="flex items-center gap-2 text-sm text-[#555]">
                        <input type="checkbox" id="recaptcha" className="rounded border-gray-300" />
                        <label htmlFor="recaptcha">I&apos;m not a robot</label>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-[#1e3a5f] hover:bg-[#2563eb] text-white font-semibold transition-colors"
                      >
                        SEND
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Action buttons: side by side */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/profile/wishlist"
                  className="py-3 rounded-lg bg-[#3898ec] hover:bg-[#2d7bc4] text-white font-semibold text-center text-sm transition-colors"
                >
                  ADD TO WISHLIST
                </Link>
                <button
                  type="button"
                  className="py-3 rounded-lg bg-[#3898ec] hover:bg-[#2d7bc4] text-white font-semibold text-sm transition-colors"
                >
                  ADD TO CART
                </button>
              </div>

              {/* What's Included */}
              <div className="rounded-xl border border-[#d3dce6] p-5">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-3">What&apos;s Included ?</h3>
                <ul className="space-y-3">
                  {whatsIncludedItems.map((item, i) => (
                    <li key={i}>
                      <span className="font-bold text-[#1A1A1A]">{item.title}:</span>{' '}
                      <span className="text-[#1A1A1A]">{item.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Need help */}
              <div className="rounded-xl border border-[#d3dce6] p-5">
                <h3 className="text-base font-bold text-[#1A1A1A] mb-2">NEED HELP?</h3>
                <p className="text-base font-bold text-[#1A1A1A]">Get in touch with Us</p>
                <a href="tel:6506877111" className="text-[#1A1A1A] hover:text-[#3898ec] mt-1 block">
                  (650) 687-7111
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
