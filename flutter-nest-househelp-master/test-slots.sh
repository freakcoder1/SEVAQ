#!/bin/bash

# Test runner script for Slots Service
echo "🧪 Running Slots Service Tests..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install test dependencies if needed
echo "📦 Checking test dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/@types/jest" ]; then
    echo "Installing test dependencies..."
    npm install --save-dev @types/jest
fi

# Run unit tests
echo ""
echo "🧪 Running Unit Tests..."
echo "------------------------"
npm test -- src/slots/slots.service.spec.ts

# Run integration tests
echo ""
echo "🧪 Running Integration Tests..."
echo "-------------------------------"
npm test -- src/slots/slots.service.integration.spec.ts

# Run all slot-related tests
echo ""
echo "🧪 Running All Slot Tests..."
echo "----------------------------"
npm test -- --testPathPattern="slots.*\\.spec\\.ts$"

echo ""
echo "✅ Test execution completed!"
echo "=================================="