export const Environment = {
  baseUrl: process.env.BASE_URL,
  apiUrl: process.env.API_URL || '',

  browser: process.env.BROWSER || 'chromium',

  headless: process.env.HEADLESS === 'true',

  timeout: Number(process.env.TIMEOUT) || 60000
};

export default Environment;