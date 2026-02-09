import { useState } from 'react';

const recentlySold = [
  {
    id: 1,
    logo: 'https://via.placeholder.com/200x80/ff0000/ffffff?text=QUICKLYZ',
    domain: 'quicklyz.com',
  },
  {
    id: 2,
    logo: 'https://via.placeholder.com/200x80/1e40af/ffffff?text=COGIOT',
    domain: 'cogiot.com',
  },
  {
    id: 3,
    logo: 'https://via.placeholder.com/200x80/06b6d4/ffffff?text=MindNeural',
    domain: 'mindneural.com',
  },
  {
    id: 4,
    logo: 'https://via.placeholder.com/200x80/f59e0b/ffffff?text=ARBOTO',
    domain: 'arboto.com',
  },
];

const faqs = [
  {
    id: 1,
    question: 'What is a premium domain name?',
    answer: 'A premium domain name is a high-quality, memorable domain that typically consists of short, common words or phrases. These domains are valuable due to their brandability, SEO benefits, and ease of recall.',
  },
  {
    id: 2,
    question: 'How can I purchase a domain name from Brandip?',
    answer: 'You can purchase a domain by browsing our listings, selecting your desired domain, and proceeding through our secure checkout process. We accept various payment methods and provide instant transfer upon completion.',
  },
  {
    id: 3,
    question: 'What payment methods do you accept?',
    answer: 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, wire transfers, and cryptocurrency payments for your convenience.',
  },
  {
    id: 4,
    question: 'Can I negotiate the price of a domain name?',
    answer: 'Yes, we are open to negotiations on domain prices. Please contact us with your offer and we will review it promptly. Some domains have fixed prices while others are negotiable.',
  },
  {
    id: 5,
    question: 'Can I transfer my domain name to another registrar?',
    answer: 'Yes, once you own the domain, you have full control to transfer it to any registrar of your choice. We provide all necessary transfer codes and support to make the process smooth.',
  },
  {
    id: 6,
    question: 'Do you offer any support services for domain management?',
    answer: 'Yes, we offer comprehensive support services including DNS management, domain forwarding, email setup, and technical assistance. Our support team is available to help you maximize your domain investment.',
  },
];

export function RecentlySoldAndFAQ() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <section className="w-full py-8 sm:py-12">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Recently Sold By Brandip Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[28px] sm:text-[36px] font-bold text-black">
              Recently Sold By Brandip
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
                aria-label="Next"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Carousel Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlySold.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex items-center justify-center h-20">
                  <img
                    src={item.logo}
                    alt={item.domain}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <p className="text-[16px] font-semibold text-black text-center">
                  {item.domain}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Frequently Asked Questions Section */}
        <div>
          <h2 className="text-[28px] sm:text-[36px] font-bold text-black mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-[#f7f7f7] rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-200 transition-colors"
                >
                  <span className="text-[16px] sm:text-[18px] font-medium text-black pr-4">
                    {faq.question}
                  </span>
                  <span className="shrink-0 text-gray-600">
                    <svg
                      className={`w-6 h-6 transition-transform ${
                        openFAQ === faq.id ? 'rotate-45' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </span>
                </button>
                {openFAQ === faq.id && (
                  <div className="px-6 pb-4 pt-0">
                    <p className="text-[15px] sm:text-[16px] text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Get A Free Consultation Banner */}
        <div className="mt-12 bg-[#2b4c9f] rounded-2xl px-8 sm:px-12 py-10 sm:py-12 relative overflow-hidden">
          {/* Decorative Paper Plane with Dotted Line */}
          <div className="absolute right-32 top-1/2 -translate-y-1/2 hidden lg:block">
            <svg className="w-64 h-32" viewBox="0 0 256 128" fill="none">
              {/* Dotted curved line */}
              <path
                d="M 20 64 Q 80 20, 140 64 Q 160 80, 180 64"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                opacity="0.5"
              />
              {/* Paper plane */}
              <path
                d="M 200 50 L 220 64 L 200 78 L 205 64 Z"
                stroke="white"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              />
              <line x1="200" y1="64" x2="215" y2="64" stroke="white" strokeWidth="2" opacity="0.7" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-[32px] sm:text-[42px] font-bold text-white leading-tight mb-3">
                GET A FREE
                <br />
                CONSULTATION
              </h2>
              <a
                href="tel:6506877111"
                className="flex items-center gap-2 text-white text-[18px] sm:text-[20px] font-medium hover:underline"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                (650) 687-7111
              </a>
            </div>

            <button
              type="button"
              className="bg-white text-[#2b4c9f] px-8 py-3.5 rounded-lg text-[16px] font-bold hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              GET IN TOUCH
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
