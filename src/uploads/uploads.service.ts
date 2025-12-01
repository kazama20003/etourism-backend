import { Inject, Injectable } from '@nestjs/common';
import {
  v2 as Cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import type { Express } from 'express';

type DestroyResponse = { result: string } | { error: string };

@Injectable()
export class UploadsService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) {}

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      this.cloudinary.uploader
        .upload_stream(
          { folder: 'e-tourism' },
          (
            error: UploadApiErrorResponse | undefined,
            result: UploadApiResponse | undefined,
          ) => {
            if (error instanceof Error) {
              return reject(
                new Error(`Cloudinary error: ${String(error.message)}`),
              );
            }

            if (!result) {
              return reject(
                new Error('Cloudinary no devolvió ningún resultado'),
              );
            }

            return resolve(result);
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<DestroyResponse> {
    return new Promise<DestroyResponse>((resolve, reject) => {
      void this.cloudinary.uploader.destroy(
        publicId,
        (
          error: UploadApiErrorResponse | undefined,
          result: { result?: string; error?: string } | undefined,
        ) => {
          if (error instanceof Error) {
            return reject(
              new Error(`Cloudinary error: ${String(error.message)}`),
            );
          }

          if (!result) {
            return reject(
              new Error(
                'Cloudinary no devolvió respuesta al eliminar la imagen',
              ),
            );
          }

          if (typeof result.error === 'string') {
            return resolve({ error: result.error });
          }

          return resolve({ result: result.result ?? 'ok' });
        },
      );
    });
  }
}
