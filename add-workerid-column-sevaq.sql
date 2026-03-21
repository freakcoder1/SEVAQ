ALTER TABLE subscriptions ADD COLUMN "assignedWorkerId" UUID;
CREATE INDEX IF NOT EXISTS idx_subscriptions_assignedWorkerId ON subscriptions("assignedWorkerId");
ALTER TABLE subscriptions ADD CONSTRAINT fk_assigned_worker FOREIGN KEY ("assignedWorkerId") REFERENCES worker(id) ON DELETE SET NULL;
