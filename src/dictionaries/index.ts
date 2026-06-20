import type { Dictionary } from "./types";

export type * from "./types";

const dictionaries = {
  en: () => import("./en").then((module) => module.default),
  th: () => import("./th").then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const locales = Object.keys(dictionaries) as Locale[];

export const defaultLocale: Locale = "en";

export const hasLocale = (locale: string): locale is Locale => locale in dictionaries;

export const getDictionary = async (locale: Locale): Promise<Dictionary> => dictionaries[locale]();
