#!/bin/sh
# Pre-commit quality checks
# This script runs the same checks as GitHub Actions CI

set -e

echo "Running pre-commit quality checks..."
echo "======================================="

# ESLint
echo ""
echo "[1/4] Running ESLint..."
pnpm lint
echo "ESLint passed!"

# Prettier format check
echo ""
echo "[2/4] Checking code formatting (Prettier)..."
pnpm format:check
echo "Formatting check passed!"

# TypeScript type check
echo ""
echo "[3/4] Running TypeScript type check..."
pnpm typecheck
echo "Type check passed!"

# Tests (optional - can be slow)
if [ "$RUN_TESTS" = "true" ]; then
  echo ""
  echo "[4/4] Running tests..."
  pnpm test
  echo "Tests passed!"
else
  echo ""
  echo "[4/4] Skipping tests (set RUN_TESTS=true to run)"
fi

echo ""
echo "======================================="
echo "All quality checks passed!"
