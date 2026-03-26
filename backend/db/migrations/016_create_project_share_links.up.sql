CREATE TABLE IF NOT EXISTS project_share_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(128) NOT NULL,
  edit_token VARCHAR(128) NOT NULL,
  settings JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_share_links_token (token),
  UNIQUE KEY uq_project_share_links_edit_token (edit_token),
  KEY idx_project_share_links_project_id (project_id),
  CONSTRAINT fk_project_share_links_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

