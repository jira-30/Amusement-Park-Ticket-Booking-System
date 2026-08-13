# AMUSEMENT PARK TICKET BOOKING SYSTEM

**Author:** Shruthi Ravi, Kavya Selvaraj, Anuj Banshal.

**Task:** To design and build a full-stack ticket booking system for an amusement park, where customers can select rides and book single or multiple tickets, and administrators can manage customer records, cancel bookings, and view analytics on ride popularity

**Framework:** Express (running on Node.js)

The Amusement Park Ticket Booking System streamlines how customers select rides and book tickets, and how administrators manage the park's operations. Customers can choose a ride, pick between single or multiple ticket bookings, and submit their details to complete a booking. Administrators can view a live, regularly updated feed of customer bookings, cancel bookings as needed, and monitor ride analytics based on how frequently each ride is chosen.

The system is backed by a relational MySQL database with a strictly defined schema and enforced relationships between rides, customers, ticket types, and bookings, ensuring transactional integrity, accurate ride-capacity tracking, and reliable analytics. All CRUD operations run through a Node.js/Express backend, with SQL queries handling validation, joins, and aggregation for reporting.

## FEATURES
### Customer's View
- [x] Browse available rides and ticket types
- [x] Book single or multiple tickets per ride
- [x] Submit customer details as part of booking

### Administrator View
- [x] View a live, continuously updated list of customer bookings
- [x] Cancel existing bookings
- [x] View ride analytics (booking frequency per ride) to identify popular attractions

### System
- [x] Relational schema enforcing data integrity across rides, customers, ticket types, and bookings
- [x] Accurate ride-capacity tracking via enforced relationships
- [x] Aggregated SQL queries powering the analytics dashboard

## TECH STACK
| LAYER              | TECHNOLOGY |
|--------------------|-----------:|
| Backend            | Node.js, Express 4     |
| Database           | MySQL (via mysql2 driver)    |
| Middleware         | cors, body-parser |
| Frontend           | JavaScript, HTML, CSS (some TypeScript)|

Entry point: Backend/server.js. Start with npm start from the Backend/ folder.

**React frontend (Vite + Supabase)**
| LAYER              | TECHNOLOGY |
|--------------------|-----------:|
|Frontend|React, TypeScript, Vite|
|Backend/DB| Supabase (Postgres)|

Entry point: src/main.tsx. Database schema/migrations are in supabase/migrations/.

## DATA MODEL
The database schema centers on four core entities:
+ Customers --> customer details captured at booking time
+ Rides --> ride information managed by administrators
+ Ticket Types --> single vs. multiple ticket options
+ Bookings --> links customers, rides, and ticket types; tracks status (active/cancelled)

Enforced foreign key relationships between these tables keep booking data consistent and make ride-capacity and analytics queries reliable.

## EER DIAGRAM
![EER_Diagram](Github-AmusementParkTicketBookingSystem/Report%20and%20Presentation/EER_AmusementParkTicketingSystem.png)

The diagram above shows the relationships between Customers, Rides, Ticket Types, and Bookings, including foreign keys enforcing referential integrity across the schema.

*Note: This is a prototype. There is no production dataset or seed script. Test records (sample names and rides) were entered manually through MySQL Workbench during development to verify that the backend correctly reads from and writes to the database, and that the frontend reflects those changes.*

## PROJECT STRUCTURE
```
Amusement-Park-Ticket-Booking-System/
├── Github-AmusementParkTicketBookingSystem/
│   ├── Backend/
│   │   ├── server.js
│   │   ├── package.json
│   │   └── package-lock.json
│   ├── Frontend/
│   │   ├── public/
│   │   │   └── index.html
│   │   ├── src/
│   │   ├── package.json
│   │   └── package-lock.json
│   └── Report and Presentation/
│       ├── EER_AmusementParkTicketingSystem.png
│       ├── FinalOutput_AmusementParkTicketingSystem.png
│       ├── Shruthi_Ravi_FinalProjectPresentation.pptx
│       └── Shruthi_Ravi_FinalProjectReport.pdf
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/
│       └── 20250810164232_shiny_limit.sql
└── README.md
```

## INSTALLATION
**Prerequisites**
+ Node.js (v16 or later recommended)
+ MySQL server (for the Backend/Frontend implementation)
+ A Supabase project (for the React/Vite implementation)
+ Backend + Frontend (Express + MySQL)

bash
git clone https://github.com/jira-30/Amusement-Park-Ticket-Booking-System.git
cd Amusement-Park-Ticket-Booking-System/Github-AmusementParkTicketBookingSystem/Backend
npm install
npm start

Check server.js for MySQL connection details and the port it listens on, and update them to match your local database. In a separate terminal, install and run the Frontend the same way from the Frontend/ folder.

React frontend (Vite + Supabase)
bash
cd Amusement-Park-Ticket-Booking-System
npm install
npm run dev

Connect to Supabase by setting the required environment variables (check src/ for how the Supabase client is initialized), then apply the migration in supabase/migrations/ to your Supabase project.









