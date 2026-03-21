ALTER TABLE subscriptions ADD COLUMN "assignedWorkerId" INTEGER;
ALTER TABLE subscriptions ADD CONSTRAINT fk_assigned_worker FOREIGN KEY ("assignedWorkerId") REFERENCES worker(id) ON DELETE SET NULL;
