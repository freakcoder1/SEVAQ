-- PostgreSQL Migration Script for SEVAQ Application
-- This script creates the complete database structure and seeds all data
-- from the original SQLite database to PostgreSQL

-- Drop database if exists (optional, uncomment if needed)
-- DROP DATABASE IF EXISTS sevaq_db;

-- Create database
CREATE DATABASE sevaq_db;

-- Connect to the database
\c sevaq_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE "user" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "role" VARCHAR(50) NOT NULL DEFAULT 'USER',
    "latitude" DECIMAL(10, 8),
    "longitude" DECIMAL(11, 8),
    "preferredLat" DECIMAL(10, 8),
    "preferredLng" DECIMAL(11, 8),
    "hasCompletedLocationSetup" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Service table
CREATE TABLE "service" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "basePrice" DECIMAL(10, 2) NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Worker table
CREATE TABLE "worker" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "bio" TEXT,
    "rating" DECIMAL(3, 2) DEFAULT 0.00,
    "reviewCount" INTEGER DEFAULT 0,
    "serviceRadiusKm" INTEGER NOT NULL DEFAULT 10,
    "currentLat" DECIMAL(10, 8),
    "currentLng" DECIMAL(11, 8),
    "lastLocationUpdate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "availabilitySchedule" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Service Worker junction table
CREATE TABLE "service_worker" (
    "worker_id" INTEGER NOT NULL REFERENCES "worker"(id) ON DELETE CASCADE,
    "service_id" INTEGER NOT NULL REFERENCES "service"(id) ON DELETE CASCADE,
    PRIMARY KEY ("worker_id", "service_id")
);

-- Create City table
CREATE TABLE "city" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Service Area table
CREATE TABLE "service_area" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "pincode" VARCHAR(10) NOT NULL,
    "cityId" INTEGER REFERENCES "city"(id),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Micro Zone table
CREATE TABLE "micro_zone" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "serviceAreaId" INTEGER NOT NULL REFERENCES "service_area"(id) ON DELETE CASCADE,
    "latitude" DECIMAL(10, 8),
    "longitude" DECIMAL(11, 8),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Waitlist table
CREATE TABLE "waitlist" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "phone" VARCHAR(20),
    "serviceAreaId" INTEGER REFERENCES "service_area"(id),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Slot table
CREATE TABLE "slot" (
    "id" SERIAL PRIMARY KEY,
    "date" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isAvailable" BOOLEAN DEFAULT true,
    "maxBookings" INTEGER DEFAULT 5,
    "currentBookings" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Booking table
CREATE TABLE "booking" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "user"(id),
    "workerId" INTEGER REFERENCES "worker"(id),
    "serviceId" INTEGER NOT NULL REFERENCES "service"(id),
    "slotId" INTEGER REFERENCES "slot"(id),
    "date" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    "customerLatitude" DECIMAL(10, 8),
    "customerLongitude" DECIMAL(11, 8),
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Payment table
CREATE TABLE "payment" (
    "id" SERIAL PRIMARY KEY,
    "bookingId" INTEGER NOT NULL REFERENCES "booking"(id) ON DELETE CASCADE,
    "amount" DECIMAL(10, 2) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "transactionId" VARCHAR(255),
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Review table
CREATE TABLE "review" (
    "id" SERIAL PRIMARY KEY,
    "bookingId" INTEGER NOT NULL REFERENCES "booking"(id) ON DELETE CASCADE,
    "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Assignment table
CREATE TABLE "assignment" (
    "id" SERIAL PRIMARY KEY,
    "bookingId" INTEGER NOT NULL REFERENCES "booking"(id) ON DELETE CASCADE,
    "workerId" INTEGER NOT NULL REFERENCES "worker"(id),
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Service Request table
CREATE TABLE "service_request" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "user"(id),
    "serviceId" INTEGER NOT NULL REFERENCES "service"(id),
    "date" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "customerLatitude" DECIMAL(10, 8),
    "customerLongitude" DECIMAL(11, 8),
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Availability table
CREATE TABLE "availability" (
    "id" SERIAL PRIMARY KEY,
    "workerId" INTEGER NOT NULL REFERENCES "worker"(id) ON DELETE CASCADE,
    "date" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isAvailable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Assignment Metrics table
CREATE TABLE "assignment_metrics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "assignmentId" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "workerId" UUID NOT NULL,
    "serviceType" VARCHAR(50) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "status" VARCHAR NOT NULL,
    "assignmentTime" DECIMAL(10, 2) NOT NULL,
    "workerRating" DECIMAL(5, 2),
    "userSatisfaction" DECIMAL(5, 2),
    "distance" DECIMAL(10, 2),
    "price" DECIMAL(10, 2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Worker Performance Metrics table
CREATE TABLE "worker_performance_metrics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "workerId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "totalAssignments" INTEGER NOT NULL DEFAULT 0,
    "successfulAssignments" INTEGER NOT NULL DEFAULT 0,
    "failedAssignments" INTEGER NOT NULL DEFAULT 0,
    "cancelledAssignments" INTEGER NOT NULL DEFAULT 0,
    "successRate" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    "averageAssignmentTime" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "averageRating" DECIMAL(5, 2) DEFAULT 0.00,
    "averageUserSatisfaction" DECIMAL(5, 2) DEFAULT 0.00,
    "totalEarnings" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "utilizationRate" DECIMAL(5, 2) DEFAULT 0.00,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create User Behavior Metrics table
CREATE TABLE "user_behavior_metrics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "successfulBookings" INTEGER NOT NULL DEFAULT 0,
    "failedBookings" INTEGER NOT NULL DEFAULT 0,
    "cancelledBookings" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    "averageSatisfaction" DECIMAL(5, 2) DEFAULT 0.00,
    "totalSpent" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "repeatBookingRate" DECIMAL(5, 2) DEFAULT 0.00,
    "servicePreferences" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create System Performance Metrics table
CREATE TABLE "system_performance_metrics" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "metricType" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "value" DECIMAL(10, 2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_user_email ON "user"("email");
CREATE INDEX idx_user_role ON "user"("role");
CREATE INDEX idx_worker_user_id ON "worker"("userId");
CREATE INDEX idx_worker_is_active ON "worker"("isActive");
CREATE INDEX idx_booking_user_id ON "booking"("userId");
CREATE INDEX idx_booking_worker_id ON "booking"("workerId");
CREATE INDEX idx_booking_status ON "booking"("status");
CREATE INDEX idx_service_request_user_id ON "service_request"("userId");
CREATE INDEX idx_service_request_status ON "service_request"("status");

-- Create indexes for metric tables
CREATE INDEX idx_assignment_metrics_assignment_id ON "assignment_metrics"("assignmentId");
CREATE INDEX idx_assignment_metrics_timestamp ON "assignment_metrics"("timestamp");
CREATE INDEX idx_assignment_metrics_service_type ON "assignment_metrics"("serviceType");
CREATE INDEX idx_assignment_metrics_location ON "assignment_metrics"("location");
CREATE INDEX idx_assignment_metrics_worker_id ON "assignment_metrics"("workerId");

CREATE INDEX idx_worker_performance_metrics_worker_id ON "worker_performance_metrics"("workerId");
CREATE INDEX idx_worker_performance_metrics_date ON "worker_performance_metrics"("date");

CREATE INDEX idx_user_behavior_metrics_user_id ON "user_behavior_metrics"("userId");
CREATE INDEX idx_user_behavior_metrics_date ON "user_behavior_metrics"("date");

CREATE INDEX idx_system_performance_metrics_metric_type ON "system_performance_metrics"("metricType");
CREATE INDEX idx_system_performance_metrics_timestamp ON "system_performance_metrics"("timestamp");

-- Insert sample cities
INSERT INTO "city" ("name", "isActive") VALUES
('Delhi', true),
('Noida', true),
('Greater Noida', true),
('Gurugram', true);

-- Insert sample service areas for Greater Noida
INSERT INTO "service_area" ("name", "pincode", "cityId", "isActive") VALUES
('Alpha 1', '201306', 3, true),
('Alpha 2', '201306', 3, true),
('Alpha 3', '201306', 3, true),
('Alpha 4', '201306', 3, true),
('Alpha 5', '201306', 3, true),
('Alpha 6', '201306', 3, true),
('Alpha 7', '201306', 3, true),
('Alpha 8', '201306', 3, true),
('Alpha 9', '201306', 3, true),
('Alpha 10', '201306', 3, true),
('Beta 1', '201307', 3, true),
('Beta 2', '201307', 3, true),
('Beta 3', '201307', 3, true),
('Beta 4', '201307', 3, true),
('Beta 5', '201307', 3, true),
('Beta 6', '201307', 3, true),
('Beta 7', '201307', 3, true),
('Beta 8', '201307', 3, true),
('Beta 9', '201307', 3, true),
('Beta 10', '201307', 3, true),
('Gamma 1', '201308', 3, true),
('Gamma 2', '201308', 3, true),
('Gamma 3', '201308', 3, true),
('Gamma 4', '201308', 3, true),
('Gamma 5', '201308', 3, true),
('Gamma 6', '201308', 3, true),
('Gamma 7', '201308', 3, true),
('Gamma 8', '201308', 3, true),
('Gamma 9', '201308', 3, true),
('Gamma 10', '201308', 3, true),
('Delta 1', '201309', 3, true),
('Delta 2', '201309', 3, true),
('Delta 3', '201309', 3, true),
('Delta 4', '201309', 3, true),
('Delta 5', '201309', 3, true),
('Delta 6', '201309', 3, true),
('Delta 7', '201309', 3, true),
('Delta 8', '201309', 3, true),
('Delta 9', '201309', 3, true),
('Delta 10', '201309', 3, true);

-- Insert sample micro zones
INSERT INTO "micro_zone" ("name", "serviceAreaId", "latitude", "longitude", "isActive") VALUES
('Alpha 1 Center', 1, 28.5805083, 77.4392111, true),
('Alpha 2 Center', 2, 28.5820000, 77.4370000, true),
('Alpha 3 Center', 3, 28.5780000, 77.4420000, true),
('Alpha 4 Center', 4, 28.5760000, 77.4440000, true),
('Alpha 5 Center', 5, 28.5830000, 77.4360000, true),
('Beta 1 Center', 11, 28.5812345, 77.4389876, true),
('Beta 2 Center', 12, 28.5850000, 77.4340000, true),
('Beta 3 Center', 13, 28.5770000, 77.4430000, true),
('Beta 4 Center', 14, 28.5798765, 77.4401234, true),
('Beta 5 Center', 15, 28.5750000, 77.4450000, true);

-- Insert sample services
INSERT INTO "service" ("name", "description", "category", "basePrice") VALUES
('Home Cleaning', 'Complete home cleaning service', 'Cleaning', 500.00),
('Deep Cleaning', 'Deep cleaning for kitchens and bathrooms', 'Cleaning', 800.00),
('Cooking', 'Home cooking service', 'Cooking', 400.00),
('Meal Preparation', 'Daily meal preparation', 'Cooking', 600.00),
('Driver', 'Personal driver service', 'Driving', 500.00),
('Errands', 'Running errands and grocery shopping', 'Errands', 300.00),
('Laundry', 'Washing, drying, and ironing', 'Laundry', 350.00),
('Babysitting', 'Professional childcare services', 'Childcare', 400.00),
('Gardening', 'Garden maintenance and landscaping', 'Gardening', 450.00),
('Senior Care', 'Elderly care and assistance', 'Care', 600.00),
('Healthy Meals', 'Nutritious and balanced meal preparation', 'Cooking', 500.00),
('Shopping', 'Grocery and shopping assistance', 'Errands', 250.00);

-- Insert sample customers (hashed password: password123)
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('john.doe@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Doe', '+919876543215', 'USER', 28.6139, 77.2090, 28.6139, 77.2090, true),
('jane.smith@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'Smith', '+919876543216', 'USER', 28.6149, 77.2095, 28.6149, 77.2095, true);

-- Insert sample workers (hashed password: password123)
-- Worker 1: Amit Kumar
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('amit.kumar@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Amit', 'Kumar', '+919876543210', 'WORKER', 28.5805083, 77.4392111, 28.5805083, 77.4392111, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(3, 'Professional cleaner with 5 years of experience. Expert in deep cleaning and sanitization.', 4.5, 127, 25, 28.5805083, 77.4392111, true, '[{"day": 1, "startTime": "09:00", "endTime": "18:00"}, {"day": 2, "startTime": "09:00", "endTime": "18:00"}, {"day": 3, "startTime": "09:00", "endTime": "18:00"}, {"day": 4, "startTime": "09:00", "endTime": "18:00"}, {"day": 5, "startTime": "09:00", "endTime": "18:00"}]');

-- Worker 2: Sunita Devi
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('sunita.devi@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sunita', 'Devi', '+919876543213', 'WORKER', 28.5820000, 77.4370000, 28.5820000, 77.4370000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(4, 'Expert in laundry and ironing services. Quick and efficient.', 4.6, 45, 25, 28.5820000, 77.4370000, true, '[{"day": 1, "startTime": "10:00", "endTime": "19:00"}, {"day": 2, "startTime": "10:00", "endTime": "19:00"}, {"day": 3, "startTime": "10:00", "endTime": "19:00"}, {"day": 4, "startTime": "10:00", "endTime": "19:00"}, {"day": 5, "startTime": "10:00", "endTime": "19:00"}]');

-- Worker 3: Vikram Singh
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('vikram.singh@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Vikram', 'Singh', '+919876543214', 'WORKER', 28.5780000, 77.4420000, 28.5780000, 77.4420000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(5, 'Full-time house help. Expert in all household chores and gardening.', 4.4, 112, 25, 28.5780000, 77.4420000, true, '[{"day": 0, "startTime": "06:00", "endTime": "20:00"}, {"day": 1, "startTime": "06:00", "endTime": "20:00"}, {"day": 2, "startTime": "06:00", "endTime": "20:00"}, {"day": 3, "startTime": "06:00", "endTime": "20:00"}, {"day": 4, "startTime": "06:00", "endTime": "20:00"}, {"day": 5, "startTime": "06:00", "endTime": "20:00"}, {"day": 6, "startTime": "06:00", "endTime": "14:00"}]');

-- Worker 4: Manoj Sharma
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('manoj.sharma@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Manoj', 'Sharma', '+919876543218', 'WORKER', 28.5760000, 77.4440000, 28.5760000, 77.4440000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(6, 'Multi-skilled professional offering cleaning, cooking, and general household assistance.', 4.5, 145, 25, 28.5760000, 77.4440000, true, '[{"day": 1, "startTime": "06:00", "endTime": "18:00"}, {"day": 2, "startTime": "06:00", "endTime": "18:00"}, {"day": 3, "startTime": "06:00", "endTime": "18:00"}, {"day": 4, "startTime": "06:00", "endTime": "18:00"}, {"day": 5, "startTime": "06:00", "endTime": "18:00"}, {"day": 6, "startTime": "07:00", "endTime": "15:00"}]');

-- Worker 5: Rita Gupta
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('rita.gupta@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rita', 'Gupta', '+919876543219', 'WORKER', 28.5830000, 77.4360000, 28.5830000, 77.4360000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(7, 'Professional organizer and cleaning expert. Specialized in decluttering and deep cleaning.', 4.7, 89, 25, 28.5830000, 77.4360000, true, '[{"day": 1, "startTime": "08:00", "endTime": "18:00"}, {"day": 2, "startTime": "08:00", "endTime": "18:00"}, {"day": 3, "startTime": "08:00", "endTime": "18:00"}, {"day": 4, "startTime": "08:00", "endTime": "18:00"}, {"day": 5, "startTime": "08:00", "endTime": "18:00"}, {"day": 6, "startTime": "09:00", "endTime": "15:00"}]');

-- Worker 6: Priya Sharma
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('priya.sharma@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Priya', 'Sharma', '+919876543211', 'WORKER', 28.5812345, 77.4389876, 28.5812345, 77.4389876, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(8, 'Experienced cook specializing in North Indian and South Indian cuisine. Home chef with passion.', 4.8, 89, 25, 28.5812345, 77.4389876, true, '[{"day": 1, "startTime": "08:00", "endTime": "20:00"}, {"day": 2, "startTime": "08:00", "endTime": "20:00"}, {"day": 3, "startTime": "08:00", "endTime": "20:00"}, {"day": 4, "startTime": "08:00", "endTime": "20:00"}, {"day": 5, "startTime": "08:00", "endTime": "20:00"}, {"day": 6, "startTime": "08:00", "endTime": "16:00"}]');

-- Worker 7: Pooja Singh
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('pooja.singh@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pooja', 'Singh', '+919876543219', 'WORKER', 28.5850000, 77.4340000, 28.5850000, 77.4340000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(9, 'Professional cook specializing in healthy and organic meals. Nutrition certified.', 4.9, 88, 25, 28.5850000, 77.4340000, true, '[{"day": 1, "startTime": "09:00", "endTime": "21:00"}, {"day": 2, "startTime": "09:00", "endTime": "21:00"}, {"day": 3, "startTime": "09:00", "endTime": "21:00"}, {"day": 4, "startTime": "09:00", "endTime": "21:00"}, {"day": 5, "startTime": "09:00", "endTime": "21:00"}, {"day": 6, "startTime": "10:00", "endTime": "18:00"}]');

-- Worker 8: Ramesh Patel
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('ramesh.patel@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ramesh', 'Patel', '+919876543220', 'WORKER', 28.5770000, 77.4430000, 28.5770000, 77.4430000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(10, 'Expert in traditional Indian cooking and catering for events.', 4.6, 134, 25, 28.5770000, 77.4430000, true, '[{"day": 1, "startTime": "07:00", "endTime": "22:00"}, {"day": 2, "startTime": "07:00", "endTime": "22:00"}, {"day": 3, "startTime": "07:00", "endTime": "22:00"}, {"day": 4, "startTime": "07:00", "endTime": "22:00"}, {"day": 5, "startTime": "07:00", "endTime": "22:00"}, {"day": 6, "startTime": "08:00", "endTime": "20:00"}]');

-- Worker 9: Rajesh Verma
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('rajesh.verma@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Rajesh', 'Verma', '+919876543212', 'WORKER', 28.5798765, 77.4401234, 28.5798765, 77.4401234, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(11, 'Reliable driver and errand runner. Safe driver with clean record.', 4.3, 64, 25, 28.5798765, 77.4401234, true, '[{"day": 0, "startTime": "07:00", "endTime": "21:00"}, {"day": 1, "startTime": "07:00", "endTime": "21:00"}, {"day": 2, "startTime": "07:00", "endTime": "21:00"}, {"day": 3, "startTime": "07:00", "endTime": "21:00"}, {"day": 4, "startTime": "07:00", "endTime": "21:00"}, {"day": 5, "startTime": "07:00", "endTime": "21:00"}, {"day": 6, "startTime": "07:00", "endTime": "21:00"}]');

-- Worker 10: Deepak Mehta
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('deepak.mehta@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Deepak', 'Mehta', '+919876543220', 'WORKER', 28.5750000, 77.4450000, 28.5750000, 77.4450000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(12, 'Errands and shopping expert. Reliable and efficient with excellent time management.', 4.4, 102, 25, 28.5750000, 77.4450000, true, '[{"day": 1, "startTime": "08:00", "endTime": "20:00"}, {"day": 2, "startTime": "08:00", "endTime": "20:00"}, {"day": 3, "startTime": "08:00", "endTime": "20:00"}, {"day": 4, "startTime": "08:00", "endTime": "20:00"}, {"day": 5, "startTime": "08:00", "endTime": "20:00"}, {"day": 6, "startTime": "09:00", "endTime": "17:00"}, {"day": 0, "startTime": "10:00", "endTime": "16:00"}]');

-- Worker 11: Sanjay Yadav
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('sanjay.yadav@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sanjay', 'Yadav', '+919876543216', 'WORKER', 28.5770000, 77.4430000, 28.5770000, 77.4430000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(13, 'Gardening and landscaping expert. 8 years of experience in maintaining beautiful gardens.', 4.6, 78, 25, 28.5770000, 77.4430000, true, '[{"day": 1, "startTime": "07:00", "endTime": "17:00"}, {"day": 2, "startTime": "07:00", "endTime": "17:00"}, {"day": 3, "startTime": "07:00", "endTime": "17:00"}, {"day": 4, "startTime": "07:00", "endTime": "17:00"}, {"day": 5, "startTime": "07:00", "endTime": "17:00"}, {"day": 6, "startTime": "08:00", "endTime": "14:00"}]');

-- Worker 12: Neha Patel
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('neha.patel@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Neha', 'Patel', '+919876543215', 'WORKER', 28.5830000, 77.4360000, 28.5830000, 77.4360000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(14, 'Professional babysitter and nanny with 6 years of experience. Certified childcare provider.', 4.7, 95, 25, 28.5830000, 77.4360000, true, '[{"day": 1, "startTime": "08:00", "endTime": "20:00"}, {"day": 2, "startTime": "08:00", "endTime": "20:00"}, {"day": 3, "startTime": "08:00", "endTime": "20:00"}, {"day": 4, "startTime": "08:00", "endTime": "20:00"}, {"day": 5, "startTime": "08:00", "endTime": "20:00"}, {"day": 6, "startTime": "09:00", "endTime": "18:00"}]');

-- Worker 13: Anita Gupta
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('anita.gupta@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Anita', 'Gupta', '+919876543217', 'WORKER', 28.5840000, 77.4350000, 28.5840000, 77.4350000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(15, 'Senior care specialist with medical background. Compassionate and experienced caregiver.', 4.8, 67, 25, 28.5840000, 77.4350000, true, '[{"day": 0, "startTime": "08:00", "endTime": "20:00"}, {"day": 1, "startTime": "08:00", "endTime": "20:00"}, {"day": 2, "startTime": "08:00", "endTime": "20:00"}, {"day": 3, "startTime": "08:00", "endTime": "20:00"}, {"day": 4, "startTime": "08:00", "endTime": "20:00"}, {"day": 5, "startTime": "08:00", "endTime": "20:00"}, {"day": 6, "startTime": "09:00", "endTime": "17:00"}]');

-- Worker 14: Lata Mishra
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('lata.mishra@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lata', 'Mishra', '+919876543221', 'WORKER', 28.5860000, 77.4330000, 28.5860000, 77.4330000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(16, 'Professional cook specializing in vegetarian and Jain cuisine.', 4.7, 76, 25, 28.5860000, 77.4330000, true, '[{"day": 1, "startTime": "07:00", "endTime": "19:00"}, {"day": 2, "startTime": "07:00", "endTime": "19:00"}, {"day": 3, "startTime": "07:00", "endTime": "19:00"}, {"day": 4, "startTime": "07:00", "endTime": "19:00"}, {"day": 5, "startTime": "07:00", "endTime": "19:00"}, {"day": 6, "startTime": "08:00", "endTime": "16:00"}]');

-- Worker 15: Kamal Singh
INSERT INTO "user" ("email", "password", "firstName", "lastName", "phone", "role", "latitude", "longitude", "preferredLat", "preferredLng", "hasCompletedLocationSetup") VALUES
('kamal.singh@househelp.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kamal', 'Singh', '+919876543222', 'WORKER', 28.5740000, 77.4460000, 28.5740000, 77.4460000, true);

INSERT INTO "worker" ("userId", "bio", "rating", "reviewCount", "serviceRadiusKm", "currentLat", "currentLng", "isActive", "availabilitySchedule") VALUES
(17, 'Multi-skilled worker with expertise in cleaning, cooking, and general maintenance.', 4.5, 156, 25, 28.5740000, 77.4460000, true, '[{"day": 1, "startTime": "06:00", "endTime": "18:00"}, {"day": 2, "startTime": "06:00", "endTime": "18:00"}, {"day": 3, "startTime": "06:00", "endTime": "18:00"}, {"day": 4, "startTime": "06:00", "endTime": "18:00"}, {"day": 5, "startTime": "06:00", "endTime": "18:00"}, {"day": 6, "startTime": "07:00", "endTime": "15:00"}]');

-- Assign services to workers
-- Amit Kumar (Worker 1) - Home Cleaning, Deep Cleaning
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (1, 1), (1, 2);

-- Sunita Devi (Worker 2) - Deep Cleaning, Laundry
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (2, 2), (2, 7);

-- Vikram Singh (Worker 3) - All cleaning services
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (3, 1), (3, 2), (3, 7);

-- Manoj Sharma (Worker 4) - All services
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (4, 1), (4, 2), (4, 3), (4, 4), (4, 7);

-- Rita Gupta (Worker 5) - Home Cleaning, Deep Cleaning
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (5, 1), (5, 2);

-- Priya Sharma (Worker 6) - Cooking, Meal Preparation
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (6, 3), (6, 4);

-- Pooja Singh (Worker 7) - Cooking, Healthy Meals
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (7, 3), (7, 11);

-- Ramesh Patel (Worker 8) - Cooking, Meal Preparation
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (8, 3), (8, 4);

-- Rajesh Verma (Worker 9) - Driver, Errands
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (9, 5), (9, 6);

-- Deepak Mehta (Worker 10) - Errands, Shopping
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (10, 6), (10, 12);

-- Sanjay Yadav (Worker 11) - Gardening
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (11, 9);

-- Neha Patel (Worker 12) - Babysitting
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (12, 8);

-- Anita Gupta (Worker 13) - Senior Care
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (13, 10);

-- Lata Mishra (Worker 14) - Cooking, Meal Preparation
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (14, 3), (14, 4);

-- Kamal Singh (Worker 15) - All services
INSERT INTO "service_worker" ("worker_id", "service_id") VALUES (15, 1), (15, 2), (15, 3), (15, 4), (15, 5);

-- Create some sample slots for today and next few days
INSERT INTO "slot" ("date", "startTime", "endTime", "isAvailable", "maxBookings", "currentBookings") VALUES
(CURRENT_DATE, '09:00:00', '10:00:00', true, 5, 0),
(CURRENT_DATE, '10:00:00', '11:00:00', true, 5, 0),
(CURRENT_DATE, '11:00:00', '12:00:00', true, 5, 0),
(CURRENT_DATE, '14:00:00', '15:00:00', true, 5, 0),
(CURRENT_DATE, '15:00:00', '16:00:00', true, 5, 0),
(CURRENT_DATE, '16:00:00', '17:00:00', true, 5, 0),
(CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:00:00', true, 5, 0),
(CURRENT_DATE + INTERVAL '1 day', '10:00:00', '11:00:00', true, 5, 0),
(CURRENT_DATE + INTERVAL '1 day', '11:00:00', '12:00:00', true, 5, 0),
(CURRENT_DATE + INTERVAL '1 day', '14:00:00', '15:00:00', true, 5, 0),
(CURRENT_DATE + INTERVAL '1 day', '15:00:00', '16:00:00', true, 5, 0),
(CURRENT_DATE + INTERVAL '1 day', '16:00:00', '17:00:00', true, 5, 0);

-- Create some sample bookings
INSERT INTO "booking" ("userId", "workerId", "serviceId", "slotId", "date", "startTime", "endTime", "status", "totalAmount", "customerLatitude", "customerLongitude", "address", "notes") VALUES
(1, 1, 1, 1, CURRENT_DATE, '09:00:00', '10:00:00', 'COMPLETED', 500.00, 28.6139, 77.2090, '123 Main Street, Delhi', 'Please be on time'),
(2, 6, 3, 2, CURRENT_DATE, '10:00:00', '11:00:00', 'CONFIRMED', 400.00, 28.6149, 77.2095, '456 Side Street, Delhi', 'Vegetarian meals preferred');

-- Create sample payments
INSERT INTO "payment" ("bookingId", "amount", "paymentMethod", "transactionId", "status") VALUES
(1, 500.00, 'CASH', 'TXN001', 'COMPLETED'),
(2, 400.00, 'ONLINE', 'TXN002', 'PENDING');

-- Create sample reviews
INSERT INTO "review" ("bookingId", "rating", "comment") VALUES
(1, 5, 'Excellent cleaning service! Very professional and thorough.'),
(2, 4, 'Good cooking service, but could be a bit more punctual.');

-- Create sample assignments
INSERT INTO "assignment" ("bookingId", "workerId", "status", "assignedAt", "confirmedAt", "completedAt") VALUES
(1, 1, 'COMPLETED', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(2, 6, 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '30 minutes', NULL);

-- Create sample service requests
INSERT INTO "service_request" ("userId", "serviceId", "date", "startTime", "endTime", "status", "customerLatitude", "customerLongitude", "address", "notes") VALUES
(1, 2, CURRENT_DATE + INTERVAL '2 days', '10:00:00', '12:00:00', 'PENDING', 28.6139, 77.2090, '123 Main Street, Delhi', 'Deep cleaning needed for kitchen'),
(2, 5, CURRENT_DATE + INTERVAL '3 days', '09:00:00', '17:00:00', 'PENDING', 28.6149, 77.2095, '456 Side Street, Delhi', 'Full day driver needed');

-- Create sample availability records
INSERT INTO "availability" ("workerId", "date", "startTime", "endTime", "isAvailable") VALUES
(1, CURRENT_DATE, '09:00:00', '18:00:00', true),
(1, CURRENT_DATE + INTERVAL '1 day', '09:00:00', '18:00:00', true),
(2, CURRENT_DATE, '10:00:00', '19:00:00', true),
(2, CURRENT_DATE + INTERVAL '1 day', '10:00:00', '19:00:00', true),
(6, CURRENT_DATE, '08:00:00', '20:00:00', true),
(6, CURRENT_DATE + INTERVAL '1 day', '08:00:00', '20:00:00', true);

-- Update sequences to match the inserted data
SELECT setval('user_id_seq', (SELECT MAX(id) FROM "user"));
SELECT setval('service_id_seq', (SELECT MAX(id) FROM "service"));
SELECT setval('worker_id_seq', (SELECT MAX(id) FROM "worker"));
SELECT setval('city_id_seq', (SELECT MAX(id) FROM "city"));
SELECT setval('service_area_id_seq', (SELECT MAX(id) FROM "service_area"));
SELECT setval('micro_zone_id_seq', (SELECT MAX(id) FROM "micro_zone"));
SELECT setval('waitlist_id_seq', (SELECT MAX(id) FROM "waitlist"));
SELECT setval('slot_id_seq', (SELECT MAX(id) FROM "slot"));
SELECT setval('booking_id_seq', (SELECT MAX(id) FROM "booking"));
SELECT setval('payment_id_seq', (SELECT MAX(id) FROM "payment"));
SELECT setval('review_id_seq', (SELECT MAX(id) FROM "review"));
SELECT setval('assignment_id_seq', (SELECT MAX(id) FROM "assignment"));
SELECT setval('service_request_id_seq', (SELECT MAX(id) FROM "service_request"));
SELECT setval('availability_id_seq', (SELECT MAX(id) FROM "availability"));

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_updated_at BEFORE UPDATE ON "service" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_worker_updated_at BEFORE UPDATE ON "worker" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_city_updated_at BEFORE UPDATE ON "city" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_area_updated_at BEFORE UPDATE ON "service_area" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_micro_zone_updated_at BEFORE UPDATE ON "micro_zone" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE ON "waitlist" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_slot_updated_at BEFORE UPDATE ON "slot" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_updated_at BEFORE UPDATE ON "booking" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON "payment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_updated_at BEFORE UPDATE ON "review" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_updated_at BEFORE UPDATE ON "assignment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_request_updated_at BEFORE UPDATE ON "service_request" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON "availability" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Display summary of created data
SELECT 'Database setup completed successfully!' as status;
SELECT 'Users created: ' || COUNT(*) as count FROM "user";
SELECT 'Services created: ' || COUNT(*) as count FROM "service";
SELECT 'Workers created: ' || COUNT(*) as count FROM "worker";
SELECT 'Bookings created: ' || COUNT(*) as count FROM "booking";
SELECT 'Payments created: ' || COUNT(*) as count FROM "payment";
SELECT 'Reviews created: ' || COUNT(*) as count FROM "review";