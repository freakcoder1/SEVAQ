#!/bin/bash
# beta-dashboard.sh - Daily metrics check for SevaQ beta

echo "=== SevaQ Beta Dashboard ==="
echo "Date: $(date)"
echo ""

echo "1. Backend Health:"
curl -s http://localhost:3000/api/health | jq .
echo ""

echo "2. Firebase Status:"
curl -s http://localhost:3000/api/notifications/firebase-status | jq .
echo ""

echo "3. Service Count:"
curl -s http://localhost:3000/api/services | jq '.total || (.data | length)'
echo ""

echo "4. Worker Count:"
curl -s http://localhost:3000/api/workers | jq '.total || (.data | length)'
echo ""

echo "Run this daily. Investigate any anomalies before adding features."