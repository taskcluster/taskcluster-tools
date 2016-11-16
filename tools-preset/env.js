module.exports = {
  NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),

  CORS_PROXY: JSON.stringify(
    process.env.CORS_PROXY || 'https://cors-proxy.taskcluster.net/request'),

  UPTIMEROBOT_API_KEY_QUEUE: JSON.stringify(
    process.env.UPTIMEROBOT_API_KEY_QUEUE || 'm776323830-a170e7abc854f94cc2f4c078'),

  UPTIMEROBOT_API_KEY_AUTH: JSON.stringify(
    process.env.UPTIMEROBOT_API_KEY_AUTH || 'm776208480-28abc3b309cb0e526a5ebce8'),

  UPTIMEROBOT_API_KEY_AWS_PROVISIONER: JSON.stringify(
    process.env.UPTIMEROBOT_API_KEY_AWS_PROVISIONER || 'm776120201-37b5da206dfd8de4b00ae25b'),

  UPTIMEROBOT_API_KEY_EVENTS: JSON.stringify(
    process.env.UPTIMEROBOT_API_KEY_EVENTS || 'm776321033-e82bb32adfa08a0bba0002c6'),

  UPTIMEROBOT_API_KEY_INDEX: JSON.stringify(
    process.env.UPTIMEROBOT_API_KEY_INDEX || 'm776362434-85a6996de0f9c73cf21bbf89'),

  UPTIMEROBOT_API_KEY_SCHEDULER: JSON.stringify(
    process.env.UPTIMEROBOT_API_KEY_SCHEDULER || 'm776120202-44923d8660c2a1bd1a5de440'),

  UPTIMEROBOT_API_KEY_SECRETS: JSON.stringify(
    process.env.UPTIMEROBOT_API_KEY_SECRETS || 'm777577313-6d58b81186c4064cf7a8d1e1'),

  SIGN_IN_METHODS: JSON.stringify(process.env.SIGN_IN_METHODS ||
    process.env.NODE_ENV === 'development' ? 'development' : 'okta persona email manual')
};
