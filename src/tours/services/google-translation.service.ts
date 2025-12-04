// src/tours/services/google-translation.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AxiosError } from 'axios';
import { Tour } from '../entities/tour.entity';
import unidecode from 'unidecode';

export type TourTranslationPayload = {
  title?: string;
  description?: string;
  slug?: string;
  meetingPoint?: string;
  metaDescription?: string;
  includes?: string[];
  excludes?: string[];
  categories?: string[];
  itinerary?: {
    order: number;
    title?: string;
    description?: string;
  }[];
};

// 👇 Tipado de la respuesta de Google Translate v2
interface GoogleTranslateV2Response {
  data: {
    translations: {
      translatedText: string;
    }[];
  };
}

interface GoogleErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/**
 * Type Guard: Verifica si el error es de Axios de forma segura.
 * Evita el uso de 'any' casteando a Record<string, unknown>, lo cual satisface al linter.
 */
function isAxiosError<T = unknown>(error: unknown): error is AxiosError<T> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as Record<string, unknown>).isAxiosError === true
  );
}

@Injectable()
export class GoogleTranslationService {
  private readonly apiKey = process.env.GOOGLE_TRANSLATE_API_KEY ?? '';
  private readonly baseUrl =
    process.env.GOOGLE_TRANSLATE_BASE_URL ??
    'https://translation.googleapis.com/language/translate/v2';

  constructor(private readonly http: HttpService) {}

  /**
   * Traduce los campos relevantes de un Tour (base ES) a otro idioma.
   * targetLang: 'it', 'de', 'en', etc.
   */
  async translateTourBase(
    base: Tour,
    targetLang: string,
  ): Promise<TourTranslationPayload> {
    if (!this.apiKey) {
      throw new InternalServerErrorException(
        'Falta GOOGLE_TRANSLATE_API_KEY en las variables de entorno',
      );
    }

    if (!targetLang || targetLang === 'es') {
      // no tiene sentido traducir a es, que es el idioma base
      return {
        title: base.title,
        description: base.description,
      };
    }

    // 1️⃣ Armar lista de textos a traducir
    const texts: string[] = [];
    const map: {
      field:
        | keyof TourTranslationPayload
        | 'itinerary.title'
        | 'itinerary.description';
      index: number;
      order?: number;
    }[] = [];

    const pushText = (
      text: string | undefined,
      field:
        | keyof TourTranslationPayload
        | 'itinerary.title'
        | 'itinerary.description',
      order?: number,
    ) => {
      if (text && text.trim().length > 0) {
        const index = texts.length;
        texts.push(text);
        map.push({ field, index, order });
      }
    };

    // Campos simples
    pushText(base.title, 'title');
    pushText(base.description, 'description');
    pushText(base.slug, 'slug');
    pushText(base.meetingPoint, 'meetingPoint');
    pushText(base.metaDescription, 'metaDescription');

    // Arrays (includes, excludes, categories)
    base.includes?.forEach((item) => pushText(item, 'includes'));
    base.excludes?.forEach((item) => pushText(item, 'excludes'));
    base.categories?.forEach((item) => pushText(item, 'categories'));

    // Itinerario: solo title y description de cada item
    base.itinerary?.forEach((item) => {
      pushText(item.title, 'itinerary.title', item.order);
      pushText(item.description, 'itinerary.description', item.order);
    });

    if (texts.length === 0) {
      // Nada que traducir -> no llamamos a Google
      return {
        title: base.title,
        description: base.description,
      };
    }

    // 👀 Debug opcional
    console.log(
      '👉 Textos que se enviarán a Google (' + targetLang + '):',
      texts.length,
    );

    // 2️⃣ Llamada a Google Translate (v2) usando BODY para q
    try {
      const response$ = this.http.post<GoogleTranslateV2Response>(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          q: texts, // 👈 ahora va en el body
          target: targetLang,
          source: 'es',
          format: 'text',
        },
      );

      const response = await firstValueFrom(response$);

      const translationsData = response.data.data.translations ?? [];
      const translations: string[] = translationsData.map(
        (t) => t.translatedText,
      );

      // 3️⃣ Reconstruir el payload traducido
      const result: TourTranslationPayload = {
        title: base.title,
        description: base.description,
        slug: base.slug,
        meetingPoint: base.meetingPoint,
        metaDescription: base.metaDescription,
        includes: [],
        excludes: [],
        categories: [],
        itinerary: base.itinerary
          ? base.itinerary.map((it) => ({
              order: it.order,
              title: it.title,
              description: it.description,
            }))
          : undefined,
      };

      for (const m of map) {
        const translatedText = translations[m.index];
        if (!translatedText) continue;

        switch (m.field) {
          case 'title':
            result.title = translatedText;
            break;
          case 'description':
            result.description = translatedText;
            break;
          case 'slug': {
            const baseTitle = result.title ?? base.title ?? 'tour';
            result.slug =
              translatedText && translatedText.trim().length > 0
                ? this.slugify(translatedText)
                : this.slugify(baseTitle);
            break;
          }
          case 'meetingPoint':
            result.meetingPoint = translatedText;
            break;
          case 'metaDescription':
            result.metaDescription = translatedText;
            break;
          case 'includes':
            if (!result.includes) result.includes = [];
            result.includes.push(translatedText);
            break;
          case 'excludes':
            if (!result.excludes) result.excludes = [];
            result.excludes.push(translatedText);
            break;
          case 'categories':
            if (!result.categories) result.categories = [];
            result.categories.push(translatedText);
            break;
          case 'itinerary.title':
          case 'itinerary.description':
            if (!result.itinerary) break;
            if (m.order == null) break;
            {
              const item = result.itinerary.find((i) => i.order === m.order);
              if (!item) break;
              if (m.field === 'itinerary.title') {
                item.title = translatedText;
              } else {
                item.description = translatedText;
              }
            }
            break;
        }
      }

      return result;
    } catch (err: unknown) {
      // ✅ CORRECCIÓN: Usamos el Type Guard.
      // Dentro del if, TypeScript sabe que 'err' es AxiosError<GoogleErrorResponse>.
      // NO asignamos 'err' a una nueva variable, lo usamos directamente.
      if (isAxiosError<GoogleErrorResponse>(err)) {
        console.error(
          '🛑 Google Translate error (Axios):',
          err.response?.status,
          JSON.stringify(
            err.response?.data ?? { message: err.message },
            null,
            2,
          ),
        );
      } else if (err instanceof Error) {
        // Error genérico de JS
        console.error('🛑 Google Translate error (Genérico):', err.message);
      } else {
        // Error completamente desconocido
        console.error('🛑 Google Translate error (Desconocido):', err);
      }

      throw new InternalServerErrorException(
        'Error al traducir con Google Translate',
      );
    }
  }

  private slugify(text: string): string {
    if (!text) return '';

    const ascii: string = unidecode(text);

    return ascii
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
