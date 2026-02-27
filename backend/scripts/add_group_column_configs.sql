-- Migration: Add group_column_configs to invoices table
-- Date: 2026-02-27

ALTER TABLE invoices ADD COLUMN group_column_configs TEXT;
