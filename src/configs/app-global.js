// project settings, you can change only PROJECT_NAME, BASE_URL and WEBSITE_URL otherwise it can break the app
export const PROJECT_NAME = 'FZap Zapbose';
export const BASE_URL =
  process.env.REACT_APP_BASE_URL || 'https://fzap.zapbose.com';
export const WEBSITE_URL = 'https://f.zapbose.com';
export const api_url = BASE_URL + '/api/v1/';
export const api_url_admin = BASE_URL + '/api/v1/dashboard/admin/';
export const api_url_admin_dashboard = BASE_URL + '/api/v1/dashboard/';
export const IMG_URL = '';
export const export_url = BASE_URL + '/storage/';
export const example = BASE_URL + '/';

// map api key, ypu can get it from https://console.cloud.google.com/apis/library
export const MAP_API_KEY = 'AIzaSyBd3O8D32huD6E9qfQpBj_sDCkEw_bQasY';

// firebase keys, do not forget to change to your own keys here and in file public/firebase-messaging-sw.js
export const VAPID_KEY =
  '';
export const API_KEY = 'AIzaSyBV3-c-rdxipPART6yV2bDIoJiQdkcBOEc';
export const AUTH_DOMAIN = 'fzap-6c7d3.firebaseapp.com';
export const PROJECT_ID = 'fzap-6c7d3';
export const STORAGE_BUCKET = 'fzap-6c7d3.firebasestorage.app';
export const MESSAGING_SENDER_ID = '885764764171';
export const APP_ID = '1:885764764171:web:afe954a87a293dfefa4d0e';
export const MEASUREMENT_ID = 'G-YVFW5BZBLS';

// recaptcha key, you can get it from https://www.google.com/recaptcha/admin/create
export const RECAPTCHASITEKEY = '6LeKjIIqAAAAAPZgP8yotioxohPAh59bWca-8Lmi';

// demo data, no need to change
export const LAT = 47.4143302506288;
export const LNG = 8.532059477976883;
export const DEMO_SELLER = 334; // seller_id
export const DEMO_SELLER_UUID = '3566bdf6-3a09-4488-8269-70a19f871bd0'; // seller_id
export const DEMO_SHOP = 599; // seller_id
export const DEMO_DELIVERYMAN = 375; // deliveryman_id
export const DEMO_MANEGER = 114; // deliveryman_id
export const DEMO_MODERATOR = 297; // deliveryman_id
export const DEMO_ADMIN = 107; // deliveryman_id
export const SUPPORTED_FORMATS = [
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/svg',
];
