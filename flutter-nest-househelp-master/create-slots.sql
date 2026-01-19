-- Create time slots for worker-1 (Ramesh Kumar)
-- Monday to Friday: 08:00-18:00 (3-hour slots)
INSERT INTO slot (id, startTime, endTime, isBooked, workerId, createdAt, updatedAt) VALUES
('slot-1-1', '2026-01-09 08:00:00', '2026-01-09 11:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-2', '2026-01-09 11:00:00', '2026-01-09 14:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-3', '2026-01-09 14:00:00', '2026-01-09 17:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-4', '2026-01-10 08:00:00', '2026-01-10 11:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-5', '2026-01-10 11:00:00', '2026-01-10 14:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-6', '2026-01-10 14:00:00', '2026-01-10 17:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-7', '2026-01-11 08:00:00', '2026-01-11 11:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-8', '2026-01-11 11:00:00', '2026-01-11 14:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-9', '2026-01-11 14:00:00', '2026-01-11 17:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-10', '2026-01-12 08:00:00', '2026-01-12 11:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-11', '2026-01-12 11:00:00', '2026-01-12 14:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-12', '2026-01-12 14:00:00', '2026-01-12 17:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-13', '2026-01-13 08:00:00', '2026-01-13 11:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-14', '2026-01-13 11:00:00', '2026-01-13 14:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-15', '2026-01-13 14:00:00', '2026-01-13 17:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-16', '2026-01-14 09:00:00', '2026-01-14 12:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-17', '2026-01-14 12:00:00', '2026-01-14 15:00:00', 0, 'worker-1', datetime('now'), datetime('now')),
('slot-1-18', '2026-01-15 10:00:00', '2026-01-15 13:00:00', 0, 'worker-1', datetime('now'), datetime('now'));

-- Create time slots for worker-2 (Priya Sharma)
-- Monday to Friday: 09:00-19:00 (3-hour slots)
INSERT INTO slot (id, startTime, endTime, isBooked, workerId, createdAt, updatedAt) VALUES
('slot-2-1', '2026-01-09 09:00:00', '2026-01-09 12:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-2', '2026-01-09 12:00:00', '2026-01-09 15:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-3', '2026-01-09 15:00:00', '2026-01-09 18:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-4', '2026-01-10 09:00:00', '2026-01-10 12:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-5', '2026-01-10 12:00:00', '2026-01-10 15:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-6', '2026-01-10 15:00:00', '2026-01-10 18:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-7', '2026-01-11 09:00:00', '2026-01-11 12:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-8', '2026-01-11 12:00:00', '2026-01-11 15:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-9', '2026-01-11 15:00:00', '2026-01-11 18:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-10', '2026-01-12 09:00:00', '2026-01-12 12:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-11', '2026-01-12 12:00:00', '2026-01-12 15:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-12', '2026-01-12 15:00:00', '2026-01-12 18:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-13', '2026-01-13 09:00:00', '2026-01-13 12:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-14', '2026-01-13 12:00:00', '2026-01-13 15:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-15', '2026-01-13 15:00:00', '2026-01-13 18:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-16', '2026-01-14 10:00:00', '2026-01-14 13:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-17', '2026-01-14 13:00:00', '2026-01-14 16:00:00', 0, 'worker-2', datetime('now'), datetime('now')),
('slot-2-18', '2026-01-15 11:00:00', '2026-01-15 14:00:00', 0, 'worker-2', datetime('now'), datetime('now'));

-- Create time slots for worker-3 (Amit Sharma)
-- Monday to Friday: 07:00-17:00 (3-hour slots)
INSERT INTO slot (id, startTime, endTime, isBooked, workerId, createdAt, updatedAt) VALUES
('slot-3-1', '2026-01-09 07:00:00', '2026-01-09 10:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-2', '2026-01-09 10:00:00', '2026-01-09 13:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-3', '2026-01-09 13:00:00', '2026-01-09 16:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-4', '2026-01-10 07:00:00', '2026-01-10 10:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-5', '2026-01-10 10:00:00', '2026-01-10 13:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-6', '2026-01-10 13:00:00', '2026-01-10 16:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-7', '2026-01-11 07:00:00', '2026-01-11 10:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-8', '2026-01-11 10:00:00', '2026-01-11 13:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-9', '2026-01-11 13:00:00', '2026-01-11 16:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-10', '2026-01-12 07:00:00', '2026-01-12 10:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-11', '2026-01-12 10:00:00', '2026-01-12 13:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-12', '2026-01-12 13:00:00', '2026-01-12 16:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-13', '2026-01-13 07:00:00', '2026-01-13 10:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-14', '2026-01-13 10:00:00', '2026-01-13 13:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-15', '2026-01-13 13:00:00', '2026-01-13 16:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-16', '2026-01-14 08:00:00', '2026-01-14 11:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-17', '2026-01-14 11:00:00', '2026-01-14 14:00:00', 0, 'worker-3', datetime('now'), datetime('now')),
('slot-3-18', '2026-01-15 09:00:00', '2026-01-15 12:00:00', 0, 'worker-3', datetime('now'), datetime('now'));