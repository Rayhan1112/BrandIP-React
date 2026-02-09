import { Link } from 'react-router-dom';

const BRANDIP_LOGO_URL = 'https://brandip.com/domain-names-for-sale/storage/app/public/channel/1/new-logo.png';

const links = [
  { label: 'Who We Are', href: '#' },
  { label: 'Contact us', href: '#contact' },
  { label: 'Blogs', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Privacy Policy', href: '#' },
];

const getHelpWith = [
  { label: 'Catchy Domain Names', href: '#' },
  { label: 'Cool Domain Names', href: '#' },
  { label: 'Cute Domain Names', href: '#' },
  { label: 'Website Name', href: '#' },
];

const popularCategories = [
  'Automotive & Automobile',
  'Ecommerce',
  'Entrepreneur, Business',
  'Financial services',
  'Foods & Beverages',
  'IT, Cloud & Infrastructure',
  'Manufacturing & Industrial',
  'Media & Communication',
  'Professional services',
  'Sales, Marketing & Advertising',
];

const whatWeOffer = [
  { label: 'Names For Sale', href: '/' },
  { label: 'Services', href: '#' },
  { label: 'Branding', href: '/branding' },
  { label: 'Trademark', href: '#' },
  { label: 'Patent', href: '/patent' },
  { label: 'Startups', href: '/startup' },
];

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#2c3e50] mb-4">
        {title}
      </h3>
      <ul className="space-y-2 text-base text-[#6c7a89]">{children}</ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer
      className="mt-auto w-full"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, var(--color-brandip-gradient-mid) 50%, var(--color-brandip-gradient-top) 100%)',
      }}
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand + description + phone + social */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src={BRANDIP_LOGO_URL}
                alt="BRANDIP"
                className="h-8 w-[120px] object-contain"
              />
            </Link>
            <p className="text-sm text-[#6c7a89] leading-snug max-w-xs">
              We create brandable domain names for new businesses and products. Find
              alluring, concise, and easy-to-recall domains for your company.
            </p>
            <a
              href="tel:6506877111"
              className="text-base text-[#6c7a89] hover:text-[#3898ec] transition-colors block"
            >
              (650) 687-7111
            </a>
            <div className="flex gap-2 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded bg-[#4a5568] text-white hover:bg-[#3898ec] transition-colors"
                aria-label="Facebook"
              >
                <span className="text-base font-semibold">f</span>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded bg-[#4a5568] text-white hover:bg-[#3898ec] transition-colors"
                aria-label="X"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded bg-[#4a5568] text-white hover:bg-[#3898ec] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded bg-[#4a5568] text-white hover:bg-[#3898ec] transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: LINKS + GET HELP WITH */}
          <div className="space-y-8">
            <FooterColumn title="LINKS">
              {links.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:text-[#3898ec] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>
            <FooterColumn title="GET HELP WITH">
              {getHelpWith.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="hover:text-[#3898ec] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </div>

          {/* Column 3: POPULAR CATEGORIES */}
          <FooterColumn title="POPULAR CATEGORIES">
            {popularCategories.map((name) => (
              <li key={name}>
                <Link to="#" className="hover:text-[#3898ec] transition-colors">
                  {name}
                </Link>
              </li>
            ))}
          </FooterColumn>

          {/* Column 4: WHAT WE OFFER */}
          <FooterColumn title="WHAT WE OFFER">
            {whatWeOffer.map((item) => (
              <li key={item.label}>
                <Link to={item.href} className="hover:text-[#3898ec] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </FooterColumn>
        </div>
      </div>
    </footer>
  );
}
