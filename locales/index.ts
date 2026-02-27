const fr_onboarding = require("./fr/onboarding.json");
const en_onboarding = require("./en/onboarding.json");
const fr_main = require("./fr/main.json");
const en_main = require("./en/main.json");
const fr_search = require("./fr/search.json");
const en_search = require("./en/search.json");
const fr_profile = require("./fr/profile.json");
const en_profile = require("./en/profile.json");

const translations = {
  fr: {
    onboarding: fr_onboarding,
    main: fr_main,
    search: fr_search,
    profile: fr_profile,
  },
  en: {
    onboarding: en_onboarding,
    main: en_main,
    search: en_search,
    profile: en_profile,
  },
};

export default translations;
