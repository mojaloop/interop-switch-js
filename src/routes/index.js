const express = require('express');
const router = express.Router();
const axios = require('axios')
const participant = require('../domain/participant/index')
const config = require('../lib/config')
const Logger = require('@mojaloop/central-services-shared').Logger
const FSPIOP_CALLBACK_URL_QUOTE_POST = 'FSPIOP_CALLBACK_URL_QUOTE_POST'
const FSPIOP_CALLBACK_URL_QUOTE_PUT = 'FSPIOP_CALLBACK_URL_QUOTE_PUT'


const provisionedParties = new Map()
config.PROVISIONED_PARTIES.forEach(party => provisionedParties.set(party.msisdn, party))


router.get('/parties/:type/:type_id', async function (req, res, next) {
  const msisdn = req.params.type
  const destinationFsp = provisionedParties.get(msisdn)
  if(!destinationFsp) res.status(404).end()

  const headers = Object.assign({}, req.headers, { 'fspiop-destination': destinationFsp.fspId})
  await axios.get(`${destinationFsp.url}/parties/${req.param.type}/${req.param.type_id}`, { headers })

  res.status(202).end()
})

router.put('/parties/:type/:type_id', async function (req, res, next) {
  const destinationAddress = req.headers['fspiop-destination']
  const destinationFsp = accountLookup.get(destinationAddress)
  const headers = Object.assign({}, req.headers, { 'fspiop-destination': destinationFsp.fspId})
  await axios.put(`${destinationFsp.url}/parties/${req.param.type}/${req.param.type_id}`, { headers })

  res.status(200).end()
})

router.post('/quotes', async function(req, res, next) {
  let headers = Object.assign({}, req.headers)
  if (!headers['fspiop-final-destination']) headers['fspiop-final-destination'] = headers['fspiop-destination']
  Logger.debug('Received post quote request from ' + headers['fspiop-source'])
  res.status(202).end()

  const nextHop = await axios.get(config.ROUTING_ENDPOINT, { headers: { 'fspiop-final-destination': headers['fspiop-final-destination'] } })
  const nextHopAddress = nextHop.data.destination
  headers['fspiop-destination'] = nextHopAddress
  const endpointDataSet =  await participant.getEndpoint(nextHopAddress, FSPIOP_CALLBACK_URL_QUOTE_POST)
  const endpoint = endpointDataSet[0].value

  Logger.debug('Forwarding post quote onto ' + nextHopAddress, 'endpoint', endpoint)
  axios.post(endpoint, req.body, { headers })

});

router.put('/quotes/:quote_id', async function(req, res, next) {
  let headers = Object.assign({}, req.headers)
  if (!headers['fspiop-final-destination']) headers['fspiop-final-destination'] = headers['fspiop-destination']
  Logger.debug('Received put quote request from ' + headers['fspiop-source'])

  const nextHop = await axios.get(config.ROUTING_ENDPOINT, { headers: { 'fspiop-final-destination': headers['fspiop-final-destination'] } })
  const nextHopAddress = nextHop.destination
  headers['fspiop-destination'] = nextHopAddress

  const endpoint = await participant.getEndpoint(nextHopAddress, FSPIOP_CALLBACK_URL_QUOTE_PUT)

  axios.put(endpoint, req.body, { headers })

  res.status(200).end()
})



module.exports = router;
