USE amusement_park;

-- Create or update rides table
CREATE TABLE IF NOT EXISTS rides (
  ride_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INT, -- in minutes
  capacity INT NOT NULL CHECK (capacity >= 0),
  ticket_price DECIMAL(6,2) NOT NULL DEFAULT 10.00
);

-- Create or update customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20)
);

-- Create ticket_types table
CREATE TABLE IF NOT EXISTS ticket_types (
  ticket_type_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price_modifier DECIMAL(5,2) NOT NULL COMMENT 'Multiplier for base price, e.g., 1.0 for regular, 0.8 for discount'
);

-- Insert default ticket types (if not already existing)
INSERT INTO ticket_types (name, price_modifier) VALUES 
('Single Ride', 1.0), 
('Full Day Pass', 5.0), 
('Group Ticket', 0.75)
ON DUPLICATE KEY UPDATE price_modifier=VALUES(price_modifier);

-- Create or update bookings table with ticket_type_id foreign key
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  ride_id INT NOT NULL,
  booking_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'Booked',
  ticket_type_id INT NOT NULL DEFAULT 1,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ride_id) REFERENCES rides(ride_id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(ticket_type_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_customer (customer_id),
  INDEX idx_ride (ride_id),
  INDEX idx_booking_time (booking_time)
);

SELECT * FROM rides;

-- 1️ Drop the existing foreign key
ALTER TABLE bookings
DROP FOREIGN KEY bookings_ibfk_2;

-- 2️⃣ Recreate it with ON DELETE CASCADE
ALTER TABLE bookings
ADD CONSTRAINT bookings_ibfk_2
FOREIGN KEY (ride_id) REFERENCES rides(ride_id)
ON DELETE CASCADE
ON UPDATE CASCADE;
