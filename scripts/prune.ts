#!/usr/bin/env tsx
import { db } from "../src/lib/db";

const r1 = db().prepare("DELETE FROM active_trains WHERE operating_date < date('now', '-3 days')").run();
const r2 = db().prepare("DELETE FROM train_routes WHERE operating_date < date('now', '-3 days')").run();
const r3 = db().prepare("DELETE FROM monitoring_sessions WHERE created_at < datetime('now', '-7 days') AND status != 'active'").run();

console.log(`[prune] active_trains: ${r1.changes}, train_routes: ${r2.changes}, sessions: ${r3.changes}`);
process.exit(0);
