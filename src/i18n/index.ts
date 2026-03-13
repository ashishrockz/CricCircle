import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './en';
import hi from './hi';
import kn from './kn';
import ta from './ta';
import te from './te';
import bn from './bn';
import ar from './ar';
import es from './es';
import fr from './fr';
import pt from './pt';

export const LANGUAGES = [
  {code: 'en', name: 'English', nativeName: 'English'},
  {code: 'hi', name: 'Hindi', nativeName: 'हिन्दी'},
  {code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ'},
  {code: 'ta', name: 'Tamil', nativeName: 'தமிழ்'},
  {code: 'te', name: 'Telugu', nativeName: 'తెలుగు'},
  {code: 'bn', name: 'Bengali', nativeName: 'বাংলা'},
  {code: 'ar', name: 'Arabic', nativeName: 'العربية'},
  {code: 'es', name: 'Spanish', nativeName: 'Español'},
  {code: 'fr', name: 'French', nativeName: 'Français'},
  {code: 'pt', name: 'Portuguese', nativeName: 'Português'},
];

i18n.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    hi: {translation: hi},
    kn: {translation: kn},
    ta: {translation: ta},
    te: {translation: te},
    bn: {translation: bn},
    ar: {translation: ar},
    es: {translation: es},
    fr: {translation: fr},
    pt: {translation: pt},
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
