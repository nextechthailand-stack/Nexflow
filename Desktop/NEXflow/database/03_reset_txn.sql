\encoding UTF8
-- Reset all transaction data (keep master data: products, customers, users, company)

BEGIN;

TRUNCATE TABLE audit_log       RESTART IDENTITY CASCADE;
TRUNCATE TABLE stock_ledger    RESTART IDENTITY CASCADE;
TRUNCATE TABLE adj_items       RESTART IDENTITY CASCADE;
TRUNCATE TABLE adj_headers     RESTART IDENTITY CASCADE;
TRUNCATE TABLE check_details   RESTART IDENTITY CASCADE;
TRUNCATE TABLE checks          RESTART IDENTITY CASCADE;
TRUNCATE TABLE invoice_items   RESTART IDENTITY CASCADE;
TRUNCATE TABLE invoices        RESTART IDENTITY CASCADE;
TRUNCATE TABLE grn_items       RESTART IDENTITY CASCADE;
TRUNCATE TABLE grn_headers     RESTART IDENTITY CASCADE;

-- Clear all document counters (API will auto-create when first doc is issued)
DELETE FROM document_counters;

COMMIT;

SELECT 'OK: transaction data cleared.' AS status;
