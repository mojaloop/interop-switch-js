const express = require('express');
const router = express.Router();
const axios = require('axios')
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

const getEndpointByType = async (fspId, type) => {
  return axios.get(`${config.ENDPOINTS_ENDPOINT}/participants/${fspId}/endpoints`).then((response) => {
    const endpoints = response.data.filter((URL) => URL.type === type)
    return endpoints ? endpoints[0] : null
  }).catch(error => Logger(`error getting endpoint type for source:\t${fspId}\ttype${type}`))
}

/**
 * Mocking an ALS by using the config
 */
router.get('/parties/:type/:type_id', async function (req, res, next) {
  const msisdn = req.params.type_id
  const destinationFsp = provisionedParties.get(msisdn)
  if(!destinationFsp) {
    res.status(404).end()
    return
  }
  res.status(202).end()

  // Determine who to send the parties back to
  const source = req.headers['fspiop-source']
  const endpointDataSet = await getEndpointByType(source, FSPIOP_CALLBACK_URL_PARTIES_PUT)
  if (endpointDataSet) {
    const endpointTemplate = endpointDataSet.value
    const endpoint = endpointTemplate.replace(/{{type}}/gi, 'msisdn').replace(/{{typeId}}/gi, msisdn)
    console.log(endpoint)
  
    const headers = Object.assign({}, { 'fspiop-destination': source, 'fspiop-source': 'switch', 'content-type': 'application/vnd.interoperability.parties+json;version=1.0' })
    const response = {
      party: {
        partyIdInfo: {
          partyIdType: 'msisdn',
          partyIdentifier: msisdn,
          fspId: destinationFsp.fspId,
          partySubIdOrType: destinationFsp.partySubIdOrType
        }
      }
    }
  
    await axios.put(endpoint, response, { headers })
  }
})

router.post('/quotes', async function (req, res, next) {
  Logger('Received post quote request from ' + req.headers['fspiop-source'])
  res.status(202).end()

  let headers = {
    'fspiop-destination': req.headers['fspiop-destination'],
    'fspiop-source': req.headers['fspiop-source'],
    'date': req.headers['date'],
    'Content-Type': "application/vnd.interoperability.quotes+json;version=1.0",
    'Accept': "application/vnd.interoperability.quotes+json;version=1.0"
  }

  const { payee, transferCurrency } = req.body

  // Alter header for Out Of Network Request
  if (payee.partyIdInfo.partySubIdOrType) {
    const currencyRouteEndpoint = config.ROUTING_ENDPOINTS[transferCurrency]
    console.log(config.ROUTING_ENDPOINTS, currencyRouteEndpoint, transferCurrency)
    axios.get(`${currencyRouteEndpoint}/peers?destinationAddress=${payee.partyIdInfo.partySubIdOrType}`).then(async response => {
      const peer = response.data[0]
      Logger('nexthop is ', peer.id)
      headers['fspiop-destination'] = peer.id
      const endpoint = await getEndpointByType(peer.id, FSPIOP_CALLBACK_URL_QUOTE_POST)
      if(endpoint) {
        Logger('Forwarding post quote onto ' + peer.id, 'endpoint', endpoint)
        let response = await axios.post(endpoint.value, req.body, { headers }).catch(error => Logger("Error posting", error))
        Logger('Response from forwarding post', response)
      } else {
        Logger(`Could not get endpoint for peer:\t${peer.id}and endpoint:\t${FSPIOP_CALLBACK_URL_QUOTE_POST}`)
      }
    }).catch(error => Logger('error getting next peer from routing service', error))
  }
});

router.put('/quotes/:quote_id', async function(req, res, next) {
  Logger('Received put quote request from ' + req.headers['fspiop-source'])

  let headers = {
    'fspiop-destination' : req.headers['fspiop-destination'],
    'fspiop-source' : req.headers['fspiop-source'],
    'date' : req.headers['date'],
    'Content-Type': "application/vnd.interoperability.quotes+json;version=1.0",
    'Accept': "application/vnd.interoperability.quotes+json;version=1.0"
  }

   const endpoint = await getEndpointByType(headers['fspiop-destination'], FSPIOP_CALLBACK_URL_QUOTE_PUT)
   if(endpoint) {
      const endpointTemplate = endpoint.value
      const endpointURL = endpointTemplate.replace(/{{quoteId}}/gi, req.params.quote_id)
      axios.put(endpointURL, req.body, { headers }).catch(error => Logger("Error putting", error))
      res.status(200).end()
   } else {
     Logger('Could not find endpoint to proxy the QUOTE PUT request')
     res.status(404).end()
   }

})

// Pass transfer requests straight onto ml-api-adatper. Done for convenience so that only one url needs to be registered.
router.post('/transfers', async function (req, res, next) {
  try {
    Logger('Received post transfer request from ' + req.headers['fspiop-source'] + '. Forwarding on to ml-api-adapter')
    let headers = {
      'fspiop-destination' : req.headers['fspiop-destination'],
      'fspiop-source' : req.headers['fspiop-source'],
      'date' : req.headers['date'],
      'Content-Type': "application/vnd.interoperability.transfers+json;version=1.0",
      'Accept': "application/vnd.interoperability.transfers+json;version=1.0"
    }

    await axios.post(`${config.TRANSFER_ENDPOINTS_BASE_URL}/transfers`, req.body, { headers }).catch(error => {
      Logger('Error forwarding transfer post request: ' + JSON.stringify(error))
      throw error
    })

    res.status(202).end()
  } catch (error) {
    Logger('Error forwarding transfer post request: ' + JSON.stringify(error))
    res.status(400).end()
  }
})

router.put('/transfers/:transfer_id', async function (req, res, next) {
  try {
    Logger('Received put transfer request from ' + req.headers['fspiop-source'] + '. Forwarding on to ml-api-adapter')
    let headers = {
      'fspiop-destination' : req.headers['fspiop-destination'],
      'fspiop-source' : req.headers['fspiop-source'],
      'date' : req.headers['date'],
      'Content-Type': "application/vnd.interoperability.transfers+json;version=1.0",
      'Accept': "application/vnd.interoperability.transfers+json;version=1.0"
    }

    await axios.put(`${config.TRANSFER_ENDPOINTS_BASE_URL}/transfers/${req.params.transfer_id}`, req.body, { headers }).catch(error => {
      Logger('Error forwarding transfer post request: ' + JSON.stringify(error))
      throw error
    })

    res.status(202).end()
  } catch (error) {
    Logger('Error forwarding transfer put request: ' + JSON.stringify(error))
    res.status(400).end()
  }
})

module.exports = router;
