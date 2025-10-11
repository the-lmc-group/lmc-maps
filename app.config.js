// Load .env into process.env during Expo config resolution so expo-constants.extra contains the values
require('dotenv').config();

const appJson = require('./app.json');

module.exports = () => {
  const extra = Object.assign({}, appJson.expo && appJson.expo.extra ? appJson.expo.extra : {});

  if (process.env.PRIM_API_BASE) extra.PRIM_API_BASE = process.env.PRIM_API_BASE;
  if (process.env.PRIM_BASE) extra.PRIM_BASE = process.env.PRIM_BASE;
  if (process.env.PRIM_API_KEY) extra.PRIM_API_KEY = process.env.PRIM_API_KEY;
  if (process.env.PRIM_KEY) extra.PRIM_KEY = process.env.PRIM_KEY;

  return {
    ...appJson,
    expo: {
      ...appJson.expo,
      extra,
    },
  };
};
