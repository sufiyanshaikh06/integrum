export interface StorageProvider {
  upload(path: string, buffer: Buffer, mimeType: string): Promise<string>; // returns fileId
  getSignedUrl(fileId: string, expiresInSeconds: number): Promise<string>;
  delete(fileId: string): Promise<void>;
}
