-- Add Google Drive folder URL to content_pieces
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
