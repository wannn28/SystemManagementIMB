-- Create project_incomes table
CREATE TABLE IF NOT EXISTS project_incomes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    tanggal DATE NOT NULL,
    kategori VARCHAR(100) NOT NULL COMMENT 'e.g., Termin 1, Termin 2, Progress Payment, etc.',
    deskripsi TEXT,
    jumlah DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status ENUM('Received', 'Pending', 'Planned') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_tanggal (tanggal),
    INDEX idx_kategori (kategori),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

