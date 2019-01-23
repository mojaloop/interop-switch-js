const express = require('express');
const router = express.Router();
const axios = require('axios')
const participant = require('../domain/participant/index')
const config = require('../lib/config')
const Logger = require('debug')('interop-switch-js')
const FSPIOP_CALLBACK_URL_QUOTE_POST = 'FSPIOP_CALLBACK_URL_QUOTE_POST'
const FSPIOP_CALLBACK_URL_QUOTE_PUT = 'FSPIOP_CALLBACK_URL_QUOTE_PUT'
const FSPIOP_CALLBACK_URL_PARTIES_PUT = 'FSPIOP_CALLBACK_URL_PARTIES_PUT'


const provisionedParties = new Map()
let data
if ( typeof config.PROVISIONED_PARTIES === "string") {
  data = JSON.parse(config.PROVISIONED_PARTIES)
}
else {
  data = config.PROVISIONED_PARTIES
}
data.forEach(party => provisionedParties.set(party.msisdn, party))


router.get('/parties/:type/:type_id', async function (req, res, next) {
  const msisdn = req.params.type_id
  const destinationFsp = provisionedParties.get(msisdn)
  if(!destinationFsp) res.status(404).end()
  res.status(202).end()

  const source = req.headers['fspiop-source']
  const endpointDataSet =  await participant.getEndpoint(source, FSPIOP_CALLBACK_URL_PARTIES_PUT)
  const endpointTemplate = endpointDataSet[0].value
  const endpoint = endpointTemplate.replace(/{{type}}/gi, 'msisdn').replace(/{{typeId}}/gi, msisdn)

  const headers = Object.assign({}, { 'fspiop-destination': destinationFsp.fspId, 'fspiop-source': destinationFsp.fspId, 'content-type': 'application/vnd.interoperability.parties+json;version=1.0' })
  const response = {
    party: {
      partyIdInfo: {
        partyIdType: 'msisdn',
        partyIdentifier: msisdn,
        fspId: destinationFsp.fspId
      }
    }
  }

  await axios.put(endpoint, response, { headers })

})

router.post('/quotes', async function(req, res, next) {
  let headers = Object.assign({}, req.headers)
  if (!headers['fspiop-final-destination']) headers['fspiop-final-destination'] = headers['fspiop-destination']
  Logger('Received post quote request from ' + headers['fspiop-source'])
  res.status(202).end()

  const nextHop = await axios.get(config.ROUTING_ENDPOINT, { headers: { 'fspiop-final-destination': headers['fspiop-final-destination'] } })
  const nextHopAddress = nextHop.data.destination
  headers['fspiop-destination'] = nextHopAddress
  const endpointDataSet =  await participant.getEndpoint(nextHopAddress, FSPIOP_CALLBACK_URL_QUOTE_POST)
  const endpoint = endpointDataSet[0].value

  Logger('Forwarding post quote onto ' + nextHopAddress, 'endpoint', endpoint)
  axios.post(endpoint, req.body, { headers }).catch(error => Logger("Error posting", error))

});

router.put('/quotes/:quote_id', async function(req, res, next) {
  let headers = Object.assign({}, req.headers)
  if (!headers['fspiop-final-destination']) headers['fspiop-final-destination'] = headers['fspiop-destination']
  Logger('Received put quote request from ' + headers['fspiop-source'])

  const nextHop = await axios.get(config.ROUTING_ENDPOINT, { headers: { 'fspiop-final-destination': headers['fspiop-final-destination'] } })
  const nextHopAddress = nextHop.data.destination
  headers['fspiop-destination'] = nextHopAddress

  const endpointDataSet =  await participant.getEndpoint(nextHopAddress, FSPIOP_CALLBACK_URL_QUOTE_PUT)
  const endpointTemplate = endpointDataSet[0].value
  const endpoint = endpointTemplate.replace(/{{quoteId}}/gi, req.params.quote_id)
  Logger('Forwarding put quote onto ' + nextHopAddress, 'endpoint', endpoint)

  axios.put(endpoint, req.body, { headers }).catch(error => Logger("Error putting", error))

  res.status(200).end()
})



module.exports = router;
