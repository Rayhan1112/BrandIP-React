import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface DailyData {
  date: string;
  sales: number;
  visitors: number;
}

export function StoreStats() {
  const [data, setData] = useState<DailyData[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalVisitors, setTotalVisitors] = useState(0);

  useEffect(() => {
    const q = query(collection(db!, 'transactions'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => doc.data());

      let salesTotal = 0;
      let ordersTotal = transactions.length;

      const grouped: Record<string, DailyData> = {};

      transactions.forEach((t: any) => {
        const date = new Date(t.createdAt?.seconds * 1000)
          .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

        salesTotal += t.amount || 0;

        if (!grouped[date]) {
          grouped[date] = { date, sales: 0, visitors: 0 };
        }

        grouped[date].sales += t.amount || 0;
      });

      const finalData = Object.values(grouped);

      setData(finalData);
      setTotalSales(salesTotal);
      setTotalOrders(ordersTotal);
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);

  return (
    <div className="space-y-8">

      {/* SALES CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Sales</p>
            <h2 className="text-2xl font-bold text-gray-800">
              {formatCurrency(totalSales)}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Orders</p>
            <p className="text-lg font-semibold text-gray-700">
              {totalOrders}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="sales"
              fill="#3898ec"
              radius={[6, 6, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* VISITORS CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Visitors</p>
            <h2 className="text-2xl font-bold text-gray-800">
              {totalVisitors}
            </h2>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="visitors"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
