import { Link } from 'react-router-dom'
export function Startup() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      <section className="max-w-4xl mx-auto pt-2 sm:pt-4 pb-4 sm:pb-6 text-center">
        <h1 className="text-[44px] font-bold text-black mb-2 leading-none">
          Startup
        </h1>
      </section>
      <p className="text-[18px] text-black leading-snug max-w-4xl mx-auto">
        Explore our unique hand-picked brand and business titles for sale, each of which includes a
        <br />
        matching premium domain name, all backed with competitive prices.   
      </p>
      <Link to="#" className="inline-block px-5 py-2 rounded-lg bg-brandip-accent hover:opacity-90 text-white font-semibold text-[17px] uppercase tracking-wide transition-colors">Start an Order</Link>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"></div>
    </div>
  )
}