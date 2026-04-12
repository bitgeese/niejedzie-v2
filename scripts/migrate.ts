#!/usr/bin/env tsx
import { migrate, closeDb } from "../src/lib/db";

try {
  migrate();
  console.log("✓ Schema applied.");
} finally {
  closeDb();
}
