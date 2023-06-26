import { google, drive_v3 as driveV3 } from 'googleapis';
import { Account } from '../models/account';

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