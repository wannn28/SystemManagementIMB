-- ============================================
-- TEST AUTO SYNC FINANCE FEATURE
-- ============================================

-- 1. Check current finances table structure
DESCRIBE finances;

-- 2. Check if migration 009 columns exist
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'imbbackend' 
  AND TABLE_NAME = 'finances'
  AND COLUMN_NAME IN ('project_id', 'source');

-- 3. Show all current finances entries
SELECT 
    id,
    tanggal,
    type,
    category,
    jumlah,
    status,
    project_id,
    source,
    keterangan
FROM finances
ORDER BY id DESC
LIMIT 20;

-- 4. Show project incomes with Received status
SELECT 
    id,
    project_id,
    tanggal,
    kategori,
    deskripsi,
    jumlah,
    status
FROM project_incomes
WHERE status = 'Received'
ORDER BY id DESC;

-- 5. Show project expenses with Paid status
SELECT 
    id,
    project_id,
    tanggal,
    kategori,
    deskripsi,
    jumlah,
    status
FROM project_expenses
WHERE status = 'Paid'
ORDER BY id DESC;

-- 6. Check synced entries (after testing)
SELECT 
    f.id as finance_id,
    f.tanggal,
    f.type,
    f.category,
    f.jumlah,
    f.source,
    f.project_id,
    p.name as project_name,
    f.keterangan
FROM finances f
LEFT JOIN projects p ON f.project_id = p.id
WHERE f.source = 'project'
ORDER BY f.id DESC;

-- 7. Compare Project Income vs Finance (Received only)
SELECT 
    'Income' as type,
    pi.id as project_entry_id,
    pi.project_id,
    p.name as project_name,
    pi.kategori,
    pi.jumlah as project_amount,
    pi.status as project_status,
    COUNT(f.id) as finance_entries,
    SUM(f.jumlah) as finance_amount
FROM project_incomes pi
LEFT JOIN projects p ON pi.project_id = p.id
LEFT JOIN finances f ON f.project_id = pi.project_id 
    AND f.source = 'project' 
    AND f.type = 'income'
    AND DATE(f.tanggal) = DATE(pi.tanggal)
WHERE pi.status = 'Received'
GROUP BY pi.id, pi.project_id, p.name, pi.kategori, pi.jumlah, pi.status
ORDER BY pi.id DESC;

-- 8. Compare Project Expense vs Finance (Paid only)
SELECT 
    'Expense' as type,
    pe.id as project_entry_id,
    pe.project_id,
    p.name as project_name,
    pe.kategori,
    pe.jumlah as project_amount,
    pe.status as project_status,
    COUNT(f.id) as finance_entries,
    SUM(f.jumlah) as finance_amount
FROM project_expenses pe
LEFT JOIN projects p ON pe.project_id = p.id
LEFT JOIN finances f ON f.project_id = pe.project_id 
    AND f.source = 'project' 
    AND f.type = 'expense'
    AND DATE(f.tanggal) = DATE(pe.tanggal)
WHERE pe.status = 'Paid'
GROUP BY pe.id, pe.project_id, p.name, pe.kategori, pe.jumlah, pe.status
ORDER BY pe.id DESC;

-- 9. Financial Summary by Source
SELECT 
    source,
    type,
    COUNT(*) as total_entries,
    SUM(jumlah) as total_amount
FROM finances
GROUP BY source, type
ORDER BY source, type;

-- 10. Financial Summary by Project
SELECT 
    p.id as project_id,
    p.name as project_name,
    f.type,
    COUNT(f.id) as total_entries,
    SUM(f.jumlah) as total_amount
FROM finances f
INNER JOIN projects p ON f.project_id = p.id
WHERE f.source = 'project'
GROUP BY p.id, p.name, f.type
ORDER BY p.id, f.type;

-- ============================================
-- CLEANUP QUERIES (USE WITH CAUTION!)
-- ============================================

-- Delete all project-synced finance entries (for re-testing)
-- DELETE FROM finances WHERE source = 'project';

-- Reset auto increment (optional)
-- ALTER TABLE finances AUTO_INCREMENT = 1;

