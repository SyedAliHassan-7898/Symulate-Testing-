export const Credentials = {
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || '',

    password: process.env.SUPER_ADMIN_PASSWORD || ''
  }
};

export default Credentials;