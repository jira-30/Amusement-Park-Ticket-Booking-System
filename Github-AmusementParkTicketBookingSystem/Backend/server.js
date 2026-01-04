const express = require('express'); //for running the app part of the MERN
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); 

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Shruthi@mysql3001', // Use your password here
  database: 'amusement_park'
});

db.connect((err) => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database amusement_park.');
});


// UTIL: Check if record exists helper
function existsInTable(table, idColumn, idValue) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';
    db.query(query, [table, idColumn, idValue], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0);
    });
  });
}

// UTIL: Check ride capacity for booking
function getRideCapacity(ride_id) {
  return new Promise((resolve, reject) => {
    db.query('SELECT capacity FROM rides WHERE ride_id = ?', [ride_id], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve(null);
      resolve(results[0].capacity);
    });
  });
}

// UTIL: Get current booking count for ride on the given date
function getBookingCount(ride_id, booking_date) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) AS count FROM bookings
      WHERE ride_id = ? AND DATE(booking_time) = ? AND status = 'Booked'
    `;
    db.query(sql, [ride_id, booking_date], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].count);
    });
  });
}

// --- Rides CRUD ---

app.get('/rides', (req, res) => {
  db.query('SELECT * FROM rides', (err, results) => {
    if (err) {
      console.error('Error fetching rides:', err);
      return res.status(500).json({ error: 'Database error fetching rides' });
    }
    res.json(results);
  });
});

app.post('/rides', (req, res) => {
  const { name, description, duration, capacity, ticket_price } = req.body;
  if (!name || !capacity) {
    return res.status(400).json({ error: 'Name and capacity are required' });
  }
  const price = ticket_price !== undefined ? ticket_price : 10.00;
  const sql = 'INSERT INTO rides (name, description, duration, capacity, ticket_price) VALUES (?, ?, ?, ?, ?)';
  db.query(sql, [name, description || '', duration || null, capacity, price], (err, results) => {
    if (err) {
      console.error('Error creating ride:', err);
      return res.status(500).json({ error: 'Database error creating ride' });
    }
    res.status(201).json({ message: 'Ride created', rideId: results.insertId });
  });
});

app.put('/rides/:id', (req, res) => {
  const rideId = req.params.id;
  const { name, description, duration, capacity, ticket_price } = req.body;
  db.query(
    'UPDATE rides SET name = ?, description = ?, duration = ?, capacity = ?, ticket_price = ? WHERE ride_id = ?',
    [name, description, duration, capacity, ticket_price, rideId],
    (err, results) => {
      if (err) {
        console.error('Error updating ride:', err);
        return res.status(500).json({ error: 'Database error updating ride' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Ride not found' });
      }
      res.json({ message: 'Ride updated' });
    }
  );
});

app.delete('/rides/:id', (req, res) => {
  const rideId = req.params.id;
  db.query('DELETE FROM rides WHERE ride_id = ?', [rideId], (err, results) => {
    if (err) {
      console.error('Error deleting ride:', err);
      return res.status(500).json({ error: 'Database error deleting ride' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    res.json({ message: 'Ride deleted' });
  });
});

// --- Customers ---

app.post('/customers', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const sql = 'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)';
  db.query(sql, [name, email || '', phone || ''], (err, results) => {
    if (err) {
      console.error('Error creating customer:', err);
      return res.status(500).json({ error: 'Database error creating customer' });
    }
    res.status(201).json({ message: 'Customer created', customerId: results.insertId });
  });
});

// --- Ticket Types ---

app.get('/ticket-types', (req, res) => {
  db.query('SELECT * FROM ticket_types', (err, results) => {
    if (err) {
      console.error('Error fetching ticket types:', err);
      return res.status(500).json({ error: 'DB error fetching ticket types' });
    }
    res.json(results);
  });
});

// --- Bookings ---

app.get('/bookings', (req, res) => {
  const sql = `
    SELECT b.booking_id, b.booking_time, b.status, 
           c.customer_id, c.name AS customer_name, c.email, c.phone,
           r.ride_id, r.name AS ride_name, r.description,
           tt.ticket_type_id, tt.name AS ticket_type_name
    FROM bookings b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rides r ON b.ride_id = r.ride_id
    JOIN ticket_types tt ON b.ticket_type_id = tt.ticket_type_id
    ORDER BY b.booking_time DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).json({ error: 'Database error fetching bookings' });
    }
    res.json(results);
  });
});

// Create booking with ticket type support and capacity check
app.post('/bookings', async (req, res) => {
  console.log('POST /bookings route hit');
  try {
    let { customer_id, ride_id, booking_time, status, ticket_type_id } = req.body;

    console.log('Received booking payload:', { customer_id, ride_id, booking_time, status, ticket_type_id });

    ticket_type_id = ticket_type_id || 1;

    if (![customer_id, ride_id, ticket_type_id].every(Number.isInteger)) {
      console.log('Validation failed: IDs must be integers');
      return res.status(400).json({ error: 'customer_id, ride_id, ticket_type_id must be integers' });
    }

    if (!booking_time) booking_time = new Date();
    booking_time = new Date(booking_time);
    if (isNaN(booking_time.getTime())) {
      console.log('Invalid booking_time format:', booking_time);
      return res.status(400).json({ error: 'Invalid booking_time format' });
    }
    const formattedBookingTime = booking_time.toISOString().slice(0, 19).replace('T', ' ');

    console.log('Formatted booking time:', formattedBookingTime);

    // Validate foreign keys existence
    const customerExists = await existsInTable('customers', 'customer_id', customer_id);
    console.log(`Customer ${customer_id} exists?`, customerExists);
    if (!customerExists) return res.status(400).json({ error: 'Invalid customer_id' });

    const rideExists = await existsInTable('rides', 'ride_id', ride_id);
    console.log(`Ride ${ride_id} exists?`, rideExists);
    if (!rideExists) return res.status(400).json({ error: 'Invalid ride_id' });

    const ticketTypeExists = await existsInTable('ticket_types', 'ticket_type_id', ticket_type_id);
    console.log(`Ticket Type ${ticket_type_id} exists?`, ticketTypeExists);
    if (!ticketTypeExists) return res.status(400).json({ error: 'Invalid ticket_type_id' });

    // Capacity check
    const capacity = await getRideCapacity(ride_id);
    console.log(`Ride ${ride_id} capacity:`, capacity);
    if (capacity === null) return res.status(400).json({ error: 'Ride not found' });

    const bookingDate = formattedBookingTime.slice(0, 10);
    const bookedCount = await getBookingCount(ride_id, bookingDate);
    console.log(`Current bookings for ride ${ride_id} on ${bookingDate}:`, bookedCount);

    if (bookedCount >= capacity) {
      console.log('Ride capacity full');
      return res.status(400).json({ error: 'Ride capacity full for the selected date' });
    }

    status = status || 'Booked';

    const sql = 'INSERT INTO bookings (customer_id, ride_id, booking_time, status, ticket_type_id) VALUES (?, ?, ?, ?, ?)';

    db.query(sql, [customer_id, ride_id, formattedBookingTime, status, ticket_type_id], (err, results) => {
      if (err) {
        console.error('Error creating booking:', err);
        return res.status(500).json({ error: 'Database error creating booking' });
      }

      console.log('Booking created with ID:', results.insertId);

      const priceSql = `
        SELECT r.ticket_price * tt.price_modifier AS price
        FROM rides r JOIN ticket_types tt ON tt.ticket_type_id = ?
        WHERE r.ride_id = ?
      `;

      db.query(priceSql, [ticket_type_id, ride_id], (err2, priceResults) => {
        if (err2) {
          console.error('Error fetching price:', err2);
        }
        const price = priceResults && priceResults[0] ? priceResults[0].price : null;

        console.log('Price calculated:', price);

        res.status(201).json({
          message: 'Booking created',
          bookingId: results.insertId,
          price: price && !isNaN(price) ? Number(price).toFixed(2) : undefined,
        });
      });
    });

  } catch (error) {
    console.error('Booking creation failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/bookings/:id', (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  db.query('UPDATE bookings SET status = ? WHERE booking_id = ?', [status, bookingId], (err, results) => {
    if (err) {
      console.error('Error updating booking:', err);
      return res.status(500).json({ error: 'Database error updating booking' });
    }
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking updated successfully' });
  });
});

app.delete('/bookings/:id', (req, res) => {
  const bookingId = req.params.id;
  db.query('DELETE FROM bookings WHERE booking_id = ?', [bookingId], (err, results) => {
    if (err) {
      console.error('Error deleting booking:', err);
      return res.status(500).json({ error: 'Database error deleting booking' });
    }
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  });
});

// --- New Endpoint: Get estimated wait time for a ride ---
app.get('/ride-wait-time/:id', async (req, res) => {
  const rideId = parseInt(req.params.id);
  if (isNaN(rideId)) return res.status(400).json({ error: 'Invalid ride ID' });

  try {
    const capacity = await getRideCapacity(rideId);
    if (capacity === null) return res.status(404).json({ error: 'Ride not found' });

    const bookingDate = new Date().toISOString().slice(0, 10);
    const bookedCount = await getBookingCount(rideId, bookingDate);

    db.query('SELECT duration FROM rides WHERE ride_id = ?', [rideId], (err, results) => {
      if (err) return res.status(500).json({ error: 'DB error fetching ride duration' });
      if (results.length === 0) return res.status(404).json({ error: 'Ride not found' });

      const duration = results[0].duration || 5; // default 5 mins
      let waitTime = 0;
      if (bookedCount >= capacity) {
        const cycles = Math.ceil(bookedCount / capacity);
        waitTime = cycles * duration;
      }
      res.json({ ride_id: rideId, estimated_wait_time_minutes: waitTime });
    });
  } catch (error) {
    console.error('Error computing wait time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Analytics endpoint ---
app.get('/analytics', (req, res) => {
  const sql = `
    SELECT r.name AS ride_name, COUNT(b.booking_id) AS booking_count, 
           SUM(r.ticket_price) AS total_revenue
    FROM bookings b
    JOIN rides r ON b.ride_id = r.ride_id
    WHERE b.status = 'Booked'
    GROUP BY r.ride_id
    ORDER BY booking_count DESC
    LIMIT 10;
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching analytics:', err);
      return res.status(500).json({ error: 'Error fetching analytics data' });
    }
    res.json(results);
  });
});






// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server started on port ${PORT}`);
});

