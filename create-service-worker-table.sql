CREATE TABLE IF NOT EXISTS service_worker (
  "workerId" INTEGER NOT NULL,
  "serviceId" INTEGER NOT NULL,
  PRIMARY KEY ("workerId", "serviceId"),
  FOREIGN KEY ("workerId") REFERENCES worker(id) ON DELETE CASCADE,
  FOREIGN KEY ("serviceId") REFERENCES service(id) ON DELETE CASCADE
);