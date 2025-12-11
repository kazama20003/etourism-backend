import type { Lang } from 'src/common/constants/languages';

export interface RouteItemPlain {
  order: number;
  name: string;
  lat: number;
  lng: number;
  image?: { url: string; publicId: string };
  translations?: Partial<Record<Lang, string>>;
}

export interface TransportPlain {
  _id: string;

  title: string;
  titleTranslations?: Partial<Record<Lang, string>>;

  description?: string;
  descriptionTranslations?: Partial<Record<Lang, string>>;

  routeDescription?: string;
  routeDescriptionTranslations?: Partial<Record<Lang, string>>;

  route?: RouteItemPlain[];

  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };

  vehicle: unknown;

  currentPrice: number;
  oldPrice?: number;

  durationHours?: number;
  durationMinutes?: number;

  departureTime?: string;
  arrivalTime?: string;

  isActive: boolean;

  images?: { url: string; publicId: string }[];
}
