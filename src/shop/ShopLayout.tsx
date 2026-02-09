import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export function ShopLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Header */}
      <Header />
      
      {/* Main Content Area - Pages render here; prevent horizontal overflow */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      
      {/* Fixed Footer */}
      <Footer />
    </div>
  );
}
