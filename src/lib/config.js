const RC = require('rc')('IOP', require('../../config/default.json'))

module.exports = {
  ENDPOINTS_ENDPOINT: RC.ENDPOINTS_ENDPOINT,
  ROUTING_ENDPOINTS: RC.ROUTING_ENDPOINTS,
  ENDPOINT_CACHE_CONFIG: RC.ENDPOINT_CACHE_CONFIG,
  PROVISIONED_PARTIES: RC.PROVISIONED_PARTIES,
  ACCOUNT_LOOKUP_DATA: RC.ACCOUNT_LOOKUP_DATA,
  DATABASE_URI: RC.DATABASE_URI,
  PORT: RC.PORT
}
