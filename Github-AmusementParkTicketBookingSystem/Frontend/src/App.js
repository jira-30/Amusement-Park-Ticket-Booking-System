import React, { useEffect, useState } from 'react';

function App() {
  const [rides, setRides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loadingRides, setLoadingRides] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [waitTimes, setWaitTimes] = useState({});
  const [analytics, setAnalytics] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState(1);

  useEffect(() => {
    fetchRides();
    fetchBookings();
    fetchAnalytics();
    fetchTicketTypes();
  }, []);

  const fetchRides = () => {
    setLoadingRides(true);
    fetch('http://localhost:3001/rides')
      .then(res => res.json())
      .then(data => {
        setRides(data);
        fetchWaitTimes(data);
      })
      .catch(console.error)
      .finally(() => setLoadingRides(false));
  };

  const fetchWaitTimes = async (ridesList) => {
    const times = {};
    for (const ride of ridesList) {
      try {
        const res = await fetch(`http://localhost:3001/ride-wait-time/${ride.ride_id}`);
        const data = await res.json();
        times[ride.ride_id] = !data.error ? data.estimated_wait_time_minutes : 0;
      } catch {
        times[ride.ride_id] = 0;
      }
    }
    setWaitTimes(times);
  };

  const fetchBookings = () => {
    setLoadingBookings(true);
    fetch('http://localhost:3001/bookings')
      .then(res => res.json())
      .then(setBookings)
      .catch(console.error)
      .finally(() => setLoadingBookings(false));
  };

  const fetchAnalytics = () => {
    setLoadingAnalytics(true);
    fetch('http://localhost:3001/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data.error ? [] : data))
      .catch(() => setAnalytics([]))
      .finally(() => setLoadingAnalytics(false));
  };

  const fetchTicketTypes = () => {
    fetch('http://localhost:3001/ticket-types')
      .then(res => res.json())
      .then(setTicketTypes)
      .catch(console.error);
  };

  const bookRide = async () => {
    if (!selectedRide) return alert('Please select a ride.');
    if (!customerName.trim() || !customerEmail.trim()) return alert('Please enter your name and email.');

    setBookingLoading(true);
    try {
      const responseCustomer = await fetch('http://localhost:3001/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerName.trim(), email: customerEmail.trim(), phone: customerPhone.trim() }),
      });
      if (!responseCustomer.ok) throw new Error((await responseCustomer.json()).error || 'Failed to create customer');
      const customerData = await responseCustomer.json();

      const responseBooking = await fetch('http://localhost:3001/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerData.customerId,
          ride_id: selectedRide,
          booking_time: new Date().toISOString(),
          status: 'Booked',
          ticket_type_id: selectedTicketType,
        }),
      });

      if (!responseBooking.ok) throw new Error((await responseBooking.json()).error || 'Failed to create booking');
      const bookingData = await responseBooking.json();

      alert(`Booking successful! Booking ID: ${bookingData.bookingId}`);

      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSelectedRide(null);
      setSelectedTicketType(1);

      fetchBookings();
      fetchRides();
    } catch (error) {
      alert(`Error booking ride: ${error.message}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await fetch(`http://localhost:3001/bookings/${bookingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to cancel booking');
      alert('Booking canceled.');
      fetchBookings();
      fetchRides();
    } catch {
      alert('Error canceling booking');
    }
  };

  const appWrapperStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
    padding: '40px 20px',
    boxSizing: 'border-box',
  };

  const containerStyle = {
    maxWidth: 1000,
    margin: '0 auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '30px 40px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
  };

  const sectionStyle = {
    marginBottom: 40,
    padding: 20,
    borderRadius: 10,
    background: 'linear-gradient(to bottom right, #ffffff, #f7faff)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  };

  const inputStyle = {
    marginBottom: 12,
    padding: 10,
    width: '100%',
    fontSize: 16,
    borderRadius: 6,
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '10px 20px',
    fontSize: 16,
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    transition: 'background-color 0.3s ease',
  };

  const buttonDisabledStyle = {
    ...buttonStyle,
    backgroundColor: '#a0c8ff',
    cursor: 'not-allowed',
  };

  return (
    <div style={appWrapperStyle}>
      <div style={containerStyle}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: 30 }}>
          🎢 Amusement Park Ride Booking System
        </h1>

        {/* Available Rides */}
        <section style={sectionStyle}>
          <h2 style={{ borderBottom: '2px solid #007BFF', paddingBottom: 8 }}>
            Available Rides {loadingRides && '(Loading...)'}
          </h2>
          {!loadingRides && rides.length === 0 && <p>No rides available currently.</p>}
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {rides.map((ride) => (
              <li key={ride.ride_id} style={{ marginBottom: 12 }}>
                <label
                  style={{
                    cursor: 'pointer',
                    display: 'block',
                    padding: 12,
                    borderRadius: 6,
                    border: selectedRide === ride.ride_id ? '2px solid #007BFF' : '1px solid #ddd',
                    backgroundColor: selectedRide === ride.ride_id ? '#eaf4ff' : '#fff',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <input
                    type="radio"
                    name="ride"
                    value={ride.ride_id}
                    checked={selectedRide === ride.ride_id}
                    onChange={() => setSelectedRide(ride.ride_id)}
                    style={{ marginRight: 10 }}
                  />
                  <strong>{ride.name}</strong> ({waitTimes[ride.ride_id] !== undefined ? `${waitTimes[ride.ride_id]} min wait` : 'Calculating...'})<br />
                  <small>{ride.description || 'No description'}</small><br />
                  <small>
                    Duration: {ride.duration ? `${ride.duration} mins` : '?'} &nbsp; | &nbsp; Capacity: {ride.capacity || '?'} &nbsp; | &nbsp; Price: ${ride.ticket_price != null ? Number(ride.ticket_price).toFixed(2) : '10.00'}
                  </small>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Customer Form */}
        <section style={sectionStyle}>
          <h2 style={{ borderBottom: '2px solid #007BFF', paddingBottom: 8 }}>Customer Details</h2>
          <input
            type="text"
            placeholder="Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Phone (optional)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            style={inputStyle}
          />

          <label style={{ display: 'block', marginBottom: 8, marginTop: 10 }}>
            Ticket Type:
            <select
              value={selectedTicketType}
              onChange={(e) => setSelectedTicketType(parseInt(e.target.value))}
              style={{ marginLeft: 10, padding: 6, fontSize: 16 }}
            >
              {ticketTypes.map((tt) => (
                <option key={tt.ticket_type_id} value={tt.ticket_type_id}>
                  {tt.name}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={bookRide}
            disabled={bookingLoading || !selectedRide || !customerName.trim() || !customerEmail.trim()}
            style={
              bookingLoading || !selectedRide || !customerName.trim() || !customerEmail.trim()
                ? buttonDisabledStyle
                : buttonStyle
            }
          >
            {bookingLoading ? 'Booking...' : 'Book Ride'}
          </button>
        </section>

        {/* Bookings */}
        <section style={sectionStyle}>
          <h2 style={{ borderBottom: '2px solid #007BFF', paddingBottom: 8 }}>
            Current Bookings {loadingBookings && '(Loading...)'}
          </h2>
          {!loadingBookings && bookings.length === 0 && <p>No bookings yet.</p>}
          {!loadingBookings && bookings.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ backgroundColor: '#007BFF', color: '#fff' }}>
                    {['Booking ID', 'Customer', 'Email', 'Phone', 'Ride', 'Ticket Type', 'Booking Time', 'Status', 'Cancel'].map(
                      (head, i) => (
                        <th key={i} style={{ padding: 10, border: '1px solid #ddd' }}>
                          {head}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.booking_id} style={{ backgroundColor: '#f9f9f9' }}>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{booking.booking_id}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{booking.customer_name}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{booking.email}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{booking.phone || '-'}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{booking.ride_name}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{booking.ticket_type_name}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>
                        {new Date(booking.booking_time).toLocaleString()}
                      </td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>{booking.status}</td>
                      <td style={{ padding: 10, border: '1px solid #ddd' }}>
                        <button
                          onClick={() => cancelBooking(booking.booking_id)}
                          disabled={booking.status !== 'Booked'}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: booking.status === 'Booked' ? '#dc3545' : '#ccc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: booking.status === 'Booked' ? 'pointer' : 'not-allowed',
                          }}
                          title={booking.status !== 'Booked' ? 'Cannot cancel this booking' : 'Cancel booking'}
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Analytics */}
        <section style={sectionStyle}>
          <h2 style={{ borderBottom: '2px solid #28a745', paddingBottom: 8 }}>
            Ride Analytics {loadingAnalytics && '(Loading...)'}
          </h2>
          {loadingAnalytics ? (
            <p>Loading analytics data...</p>
          ) : analytics.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: '#28a745', color: '#fff' }}>
                  <th style={{ padding: 10, border: '1px solid #ddd' }}>Ride Name</th>
                  <th style={{ padding: 10, border: '1px solid #ddd' }}>Number of Bookings</th>
                  <th style={{ padding: 10, border: '1px solid #ddd' }}>Total Revenue ($)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((item, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f0fff0' : '#e6ffe6' }}>
                    <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.ride_name}</td>
                    <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.booking_count}</td>
                    <td style={{ padding: 10, border: '1px solid #ddd' }}>{item.total_revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No analytics data available yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;







