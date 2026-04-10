const axios = require('axios');

async function testFullFlow() {
  const base = 'http://127.0.0.1:45357/api';
  
  try {
    // 1. Login
    console.log('=== 1. Testing Login ===');
    const loginRes = await axios.post(`${base}/auth/login`, {
      email: 'admin@sevaq.com',
      password: 'Admin@123456'
    });
    const token = loginRes.data.access_token;
    console.log('✅ Login successful');
    const headers = { headers: { Authorization: 'Bearer ' + token } };

    // 2. Dashboard
    console.log('\n=== 2. Testing Dashboard ===');
    const dashRes = await axios.get(`${base}/admin/dashboard`, headers);
    const d = dashRes.data;
    console.log(`✅ Dashboard: Users=${d.totalUsers}, Workers=${d.totalWorkers}, Bookings=${d.totalBookings}, Revenue=${d.totalRevenue}`);

    // 3. Workers
    console.log('\n=== 3. Testing Workers ===');
    const workersRes = await axios.get(`${base}/admin/workers`, headers);
    console.log(`✅ Workers count: ${workersRes.data.length}`);
    if (workersRes.data.length > 0) {
      const w = workersRes.data[0];
      console.log(`   First worker: ${w.user?.firstName} ${w.user?.lastName} (${w.user?.email})`);
    }

    // 4. Bookings
    console.log('\n=== 4. Testing Bookings ===');
    const bookingsRes = await axios.get(`${base}/admin/bookings`, headers);
    console.log(`✅ Bookings count: ${bookingsRes.data.length}`);
    if (bookingsRes.data.length > 0) {
      const b = bookingsRes.data[0];
      console.log(`   First booking: ${b.user?.firstName} ${b.user?.lastName}, Status: ${b.status}, Amount: ${b.amount}`);
    }

    // 5. Revenue Analytics
    console.log('\n=== 5. Testing Revenue Analytics ===');
    const revRes = await axios.get(`${base}/admin/analytics/revenue`, headers);
    const r = revRes.data;
    console.log(`✅ Revenue: Total=${r.totalRevenue}, AvgPerBooking=${r.averagePerBooking}`);
    console.log(`   By Service: ${JSON.stringify(r.revenueByService)}`);

    // 6. Booking Analytics
    console.log('\n=== 6. Testing Booking Analytics ===');
    const bookRes = await axios.get(`${base}/admin/analytics/bookings`, headers);
    const bk = bookRes.data;
    console.log(`✅ Bookings: Total=${bk.totalBookings}, CompletionRate=${bk.completionRate}, CancellationRate=${bk.cancellationRate}`);
    console.log(`   By Status: ${JSON.stringify(bk.bookingsByStatus)}`);

    // 7. Users
    console.log('\n=== 7. Testing Users ===');
    const usersRes = await axios.get(`${base}/admin/users`, headers);
    console.log(`✅ Users count: ${usersRes.data.length}`);
    if (usersRes.data.length > 0) {
      const u = usersRes.data[0];
      console.log(`   First user: ${u.firstName} ${u.lastName} (${u.email}), Role: ${u.role}`);
    }

    // 8. System Metrics
    console.log('\n=== 8. Testing System Metrics ===');
    const metricsRes = await axios.get(`${base}/metrics/system`, headers);
    console.log(`✅ System metrics: ${JSON.stringify(metricsRes.data).substring(0, 200)}...`);

    console.log('\n🎉 All API endpoints working correctly!');

  } catch (e) {
    console.error('❌ Error:', e.response?.status, e.response?.data?.message || e.message);
  }
}

testFullFlow();
