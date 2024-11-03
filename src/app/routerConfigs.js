export default {
  "auth.js": {
    base: "/auth",
    needsAuthentication: false,
  },
  "landing.js": {
    needsAuthentication: false,
  },
  "home.js": {
    needsAuthentication: true,
  },
};
/*
 *All the values and keys the config supports
 * key: base, value: string #sets the base for the router
 * key: needsAuthentication, value: boolean #sets if the route will be authenticated before exploring the routes
 * */
