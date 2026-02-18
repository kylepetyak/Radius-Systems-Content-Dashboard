import { google } from "googleapis";

/**
 * Google Drive folder creation service.
 *
 * Requires these env vars:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  – service account client_email
 *   GOOGLE_SERVICE_ACCOUNT_KEY    – service account private_key (PEM, with \n line breaks)
 *   GOOGLE_DRIVE_PARENT_FOLDER_ID – ID of the shared folder where project folders are created
 */

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error("Google Drive service account credentials not configured");
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Creates a project folder with subfolders inside the configured parent folder.
 *
 * Structure:
 *   ParentFolder/
 *     ClientName - Content Title - YYYY-MM-DD/
 *       Raw Footage/
 *       Audio/
 *       Photos/
 *
 * Returns the web link to the created project folder.
 */
export async function createProjectFolder(
  clientName: string,
  contentTitle: string,
  date: string, // YYYY-MM-DD
  clientEmail?: string // client's email — folder will be shared with them
): Promise<{ folderId: string; folderUrl: string }> {
  const drive = getDriveClient();
  const parentId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

  if (!parentId) {
    throw new Error("GOOGLE_DRIVE_PARENT_FOLDER_ID not configured");
  }

  const folderName = `${clientName} - ${contentTitle} - ${date}`;

  // Create the main project folder
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id, webViewLink",
  });

  const folderId = folder.data.id!;
  const folderUrl = folder.data.webViewLink!;

  // Create subfolders + set permissions in parallel
  const subfolders = ["Raw Footage", "Audio", "Photos"];
  const tasks: Promise<unknown>[] = subfolders.map((name) =>
    drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [folderId],
      },
    })
  );

  // Make folder accessible via link (anyone with link can upload)
  tasks.push(
    drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "writer",
        type: "anyone",
      },
    })
  );

  // Also share directly with the client's email so it appears in their Drive
  if (clientEmail) {
    tasks.push(
      drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: "writer",
          type: "user",
          emailAddress: clientEmail,
        },
        sendNotificationEmail: false,
      })
    );
  }

  await Promise.all(tasks);

  return { folderId, folderUrl };
}

/**
 * Check whether the Google Drive integration is configured.
 */
export function isDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY &&
    process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
  );
}
