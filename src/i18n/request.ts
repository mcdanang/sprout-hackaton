import { getRequestConfig } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // This will typically be one of `[ 'en', 'id' ]`
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale: locale as string,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
