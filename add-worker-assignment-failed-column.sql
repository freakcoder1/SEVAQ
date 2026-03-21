-- Add worker_assignment_failed column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN worker_assignment_failed BOOLEAN DEFAULT false;
