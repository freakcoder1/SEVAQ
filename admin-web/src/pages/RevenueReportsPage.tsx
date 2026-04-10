import { useState } from 'react';
import { apiService } from '../services/api';

interface RevenueReportData {
  totalRevenue: number;
  totalBookings: number;
  averageOrderValue?: number;
  byService?: Array<{ serviceName: string; bookingCount: number; revenue: number }>;
  byWorker?: Array<{ workerName: string; bookingCount: number; revenue: number }>;
  byMonth?: Array<{ month: string; revenue: number }>;
}

interface PayoutReportData {
  totalPaid: number;
  totalPending: number;
  totalPayouts?: number;
  completedPayouts?: number;
  payoutsByWorker?: Array<{ worker: string; amount: number; status: string }>;
  payouts?: Array<{ worker: string; amount: number; status: string }>;
}

export default function RevenueReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [revenueReport, setRevenueReport] = useState<RevenueReportData | null>(null);
  const [payoutReport, setPayoutReport] = useState<PayoutReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [revenue, payouts] = await Promise.all([
        apiService.getRevenueReport(startDate, endDate),
        apiService.getPayoutReport(startDate, endDate),
      ]);
      setRevenueReport(revenue);
      setPayoutReport(payouts);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => `"${row[h] ?? ''}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Revenue Reports</h1>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {revenueReport && (
        <>
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold text-green-600">₹{revenueReport.totalRevenue?.toLocaleString() ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
              <p className="text-2xl font-bold text-blue-600">{revenueReport.totalBookings ?? 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
              <p className="text-2xl font-bold text-purple-600">₹{revenueReport.averageOrderValue?.toLocaleString() ?? 0}</p>
            </div>
          </div>

          {/* Revenue by Service */}
          {revenueReport.byService && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Revenue by Service</h2>
                <button
                  onClick={() => exportToCSV(revenueReport.byService!, 'revenue_by_service')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Export CSV
                </button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueReport.byService.map((s: any, i: number) => (
                    <tr key={i}>
                      <td className="px-6 py-4">{s.serviceName}</td>
                      <td className="px-6 py-4">{s.bookingCount}</td>
                      <td className="px-6 py-4">₹{s.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Revenue by Worker */}
          {revenueReport.byWorker && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-lg font-semibold">Revenue by Worker</h2>
                <button
                  onClick={() => exportToCSV(revenueReport.byWorker!, 'revenue_by_worker')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Export CSV
                </button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueReport.byWorker.map((w: any, i: number) => (
                    <tr key={i}>
                      <td className="px-6 py-4">{w.workerName}</td>
                      <td className="px-6 py-4">{w.bookingCount}</td>
                      <td className="px-6 py-4">₹{w.revenue?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Payout Summary */}
      {payoutReport && (
        <div className="bg-white rounded-lg shadow">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Payout Summary</h2>
            <button
              onClick={() => exportToCSV(payoutReport.payouts ?? [], 'payout_summary')}
              className="text-blue-600 hover:text-blue-800"
            >
              Export CSV
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Payouts</h3>
                <p className="text-xl font-bold">₹{payoutReport.totalPayouts?.toLocaleString() ?? 0}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Completed Payouts</h3>
                <p className="text-xl font-bold text-green-600">₹{payoutReport.completedPayouts?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!revenueReport && !loading && (
        <div className="text-center text-gray-500 py-12">
          Select a date range and click "Generate Report" to view revenue data.
        </div>
      )}
    </div>
  );
}
