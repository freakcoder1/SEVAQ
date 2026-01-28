CREATE TABLE IF NOT EXISTS service_worker (
  "worker_id" INTEGER NOT NULL,
  "service_id" INTEGER NOT NULL,
  PRIMARY KEY ("worker_id", "service_id"),
  FOREIGN KEY ("worker_id") REFERENCES worker(id) ON DELETE CASCADE,
  FOREIGN KEY ("service_id") REFERENCES service(id) ON DELETE CASCADE
);