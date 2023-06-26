import { google, drive_v3 as driveV3 } from 'googleapis';
import { Account } from '../models/account';
import { collections } from './database';

export class GoogleDrive {

  private drive: driveV3.Drive;

  constructor(serviceAccount: Account) {
    const auth = new google.auth.JWT({
      email: serviceAccount.email,
      key: serviceAccount.privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    this.drive = google.drive({ version: 'v3', auth });
  }

  async list(
    query: string = "'me' in owners",
    pageSize: number = 25
  ): Promise<driveV3.Schema$File[]> {
    try {
      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        fields: 'nextPageToken, files(id, name, size, mimeType)',
      });

      const files = response.data.files;
      if (files && files.length) {
        return files;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async get(fileId: string): Promise<driveV3.Schema$File> {
    try {
      const response = await this.drive.files.get(
        { fileId, fields: 'id, name, parents, owners(emailAddress)' }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  async delete(fileId: string, trash: boolean = true): Promise<void> {
    try {
      if (trash) {
        await this.drive.files.update({
          fileId,
          requestBody: { trashed: true },
        });
        console.log("File has been trashed!")
      } else {
        await this.drive.files.delete({ fileId });
        console.log("File deleted permanently!")
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

}

export async function findAndDelete(fileId: string) {
  const accounts = collections.accounts!;
  const queryDrive = new GoogleDrive(accounts[0]);
  const file = await queryDrive.get(fileId);

  if (file.owners && file.owners.length) {
    const owner = file.owners[0].emailAddress;
    const ownerAccount = accounts.find((account) => account.email === owner);

    if (ownerAccount) {
      const drive = new GoogleDrive(ownerAccount);
      console.log(`Deleting file  ${file.name} (${fileId}) from ${owner}...`);
      await drive.delete(fileId, false);

      const parentFolderId = file.parents && file.parents.length ? file.parents[0] : null;
      if (parentFolderId) {
        const parentFolder = await drive.list(`'${parentFolderId}' in parents and trashed = false`);

        if (parentFolder.length === 0) {
          console.log(`Parent folder (${parentFolderId}) is empty! Deleting...`);
          await drive.delete(parentFolderId, false);
        } else {
          console.log(`Parent folder ${parentFolderId} not empty!`);
        }
      }
    } else {
      console.error(`Owner account ${owner} not found!`);
    }
  }
  return false
}
