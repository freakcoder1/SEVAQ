# PostgreSQL Setup Guide for SEVAQ Application

This guide will help you set up PostgreSQL for the SEVAQ application and migrate all data from the SQLite database.

## Prerequisites

1. **PostgreSQL Installed**: Ensure PostgreSQL is installed on your system
2. **PostgreSQL Service Running**: Make sure the PostgreSQL service is running
3. **psql Command Available**: Ensure you can run `psql` commands from terminal

## Step 1: Create PostgreSQL Database

### Option A: Using psql Command Line

1. Open terminal/command prompt
2. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```
   (Replace `postgres` with your PostgreSQL username if different)

3. Create the database:
   ```sql
   CREATE DATABASE sevaq_db;
   ```

4. Connect to the new database:
   ```sql
   \c sevaq_db;
   ```

5. Exit psql:
   ```sql
   \q
   ```

### Option B: Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click on "Databases" and select "Create" > "Database"
3. Name: `sevaq_db`
4. Click "Save"

## Step 2: Run the Migration Script

### Option A: Using psql Command Line

1. Navigate to the project directory:
   ```bash
   cd /path/to/newsevaq
   ```

2. Run the migration script:
   ```bash
   psql -U postgres -d sevaq_db -f POSTGRESQL_MIGRATION_SCRIPT.sql
   ```
   (Replace `postgres` with your PostgreSQL username if different)

### Option B: Using pgAdmin

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on the `sevaq_db` database
4. Select "Query Tool"
5. Copy and paste the contents of `POSTGRESQL_MIGRATION_SCRIPT.sql`
6. Click "Execute" (or F5)

## Step 3: Update Environment Configuration

Ensure your `.env` file has the correct PostgreSQL configuration:

```env
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/sevaq_db
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=sevaq_user
DB_PASSWORD=sevaq_password
DB_NAME=sevaq_db
DB_TYPE=postgres

# Application Configuration
PORT=3000
JWT_SECRET=your_jwt_secret_key_here

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api
```

## Step 4: Verify Database Setup

### Check Database Connection

1. Start the application:
   ```bash
   cd flutter-nest-househelp-master
   npm run start:dev
   ```

2. Check the logs for successful database connection:
   ```
   TypeORM entities: [ 'User', 'Service', 'Worker', 'Slot', 'Booking', 'Payment', 'Review', 'MicroZone', 'ServiceArea', 'Waitlist', 'ServiceRequest' ]
   ```

### Verify Data Migration

Run these SQL queries to verify data was migrated correctly:

```sql
-- Check users
SELECT COUNT(*) as total_users FROM "user";
SELECT email, firstName, lastName, role FROM "user";

-- Check workers
SELECT COUNT(*) as total_workers FROM "worker";
SELECT w.id, u.firstName, u.lastName, w.rating, w.reviewCount 
FROM "worker" w 
JOIN "user" u ON w."userId" = u.id;

-- Check services
SELECT COUNT(*) as total_services FROM "service";
SELECT name, category, basePrice FROM "service";

-- Check bookings
SELECT COUNT(*) as total_bookings FROM "booking";
```

## Database Structure Overview

The PostgreSQL database includes the following tables:

### Core Tables
- **user**: User accounts (customers and workers)
- **service**: Available services
- **worker**: Worker profiles and details
- **service_worker**: Many-to-many relationship between workers and services

### Business Logic Tables
- **booking**: Service bookings
- **payment**: Payment transactions
- **review**: Customer reviews
- **assignment**: Worker assignments to bookings
- **service_request**: Service requests

### Location Tables
- **city**: City information
- **service_area**: Service areas with pincodes
- **micro_zone**: Specific micro-zones within service areas
- **waitlist**: Waitlist entries

### Support Tables
- **slot**: Time slots for bookings
- **availability**: Worker availability schedules

## Troubleshooting

### Common Issues

1. **Connection Refused Error**
   - Ensure PostgreSQL service is running
   - Check if port 5432 is available
   - Verify database credentials in `.env`

2. **Database Does Not Exist**
   - Ensure you created the `sevaq_db` database
   - Check database name in `.env` file

3. **Permission Denied**
   - Ensure your PostgreSQL user has CREATE and INSERT permissions
   - Try running as superuser or with appropriate privileges

4. **Extension Not Found**
   - The script automatically creates the `uuid-ossp` extension
   - If you get errors, run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Reset Database (if needed)

If you need to start fresh:

```sql
-- Drop database (be careful!)
DROP DATABASE IF EXISTS sevaq_db;

-- Recreate and run migration script again
CREATE DATABASE sevaq_db;
\c sevaq_db;
\i POSTGRESQL_MIGRATION_SCRIPT.sql
```

## Application Data

### Users Created
- **Customers**: 2 users (John Doe, Jane Smith)
- **Workers**: 15 workers with complete profiles

### Services Available
1. Home Cleaning (Cleaning)
2. Deep Cleaning (Cleaning)
3. Cooking (Cooking)
4. Meal Preparation (Cooking)
5. Driver (Driving)
6. Errands (Errands)
7. Laundry (Laundry)
8. Babysitting (Childcare)
9. Gardening (Gardening)
10. Senior Care (Care)
11. Healthy Meals (Cooking)
12. Shopping (Errands)

### Workers by Specialization

**Cleaning Specialists:**
- Amit Kumar (Rating: 4.5, 127 reviews)
- Sunita Devi (Rating: 4.6, 45 reviews)
- Vikram Singh (Rating: 4.4, 112 reviews)
- Manoj Sharma (Rating: 4.5, 145 reviews)
- Rita Gupta (Rating: 4.7, 89 reviews)

**Cooking Specialists:**
- Priya Sharma (Rating: 4.8, 89 reviews)
- Pooja Singh (Rating: 4.9, 88 reviews)
- Ramesh Patel (Rating: 4.6, 134 reviews)
- Lata Mishra (Rating: 4.7, 76 reviews)

**Driver/Errands Specialists:**
- Rajesh Verma (Rating: 4.3, 64 reviews)
- Deepak Mehta (Rating: 4.4, 102 reviews)
- Sanjay Yadav (Rating: 4.6, 78 reviews)

**Care Specialists:**
- Neha Patel (Rating: 4.7, 95 reviews)
- Anita Gupta (Rating: 4.8, 67 reviews)
- Kamal Singh (Rating: 4.5, 156 reviews)

All workers have:
- 25km service radius
- Greater Noida coordinates
- Complete availability schedules
- Professional bios and experience details

## Next Steps

1. **Start the Application**: Run `npm run start:dev` in the `flutter-nest-househelp-master` directory
2. **Test API Endpoints**: Use Postman or curl to test the API endpoints
3. **Frontend Integration**: Connect your Flutter frontend to the new PostgreSQL backend
4. **Monitor Logs**: Check application logs for any database-related issues

## Support

If you encounter any issues during setup:

1. Check the application logs for specific error messages
2. Verify PostgreSQL service is running
3. Ensure all environment variables are correctly set
4. Confirm database user has necessary permissions

The application should now be fully functional with PostgreSQL as the database backend, containing all the data that was previously in the SQLite database.