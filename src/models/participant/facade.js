/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Georgi Georgiev <georgi.georgiev@modusbox.com>
 --------------
 ******/

'use strict'

/**
 * @module src/models/participant/facade/
 */

const Db = require('../../db')

/**
 * @function GetEndpoint
 *
 * @async
 * @description This retuns the active endpoint value for a give participantId and type of endpoint
 *
 *
 * @param {integer} participantId - the id of the participant in the database. Example 1
 * @param {string} type - the type of the endpoint. Example 'FSPIOP_CALLBACK_URL_TRANSFER_POST'
 *
 * @returns {array} - Returns participantEndpoint array containing the details of active endpoint for the participant if successful, or throws an error if failed
 */

const getEndpoint = async (participantId, endpointType) => {
  try {
    return Db.participantEndpoint.query(builder => {
      return builder.innerJoin('endpointType AS et', 'participantEndpoint.endpointTypeId', 'et.endpointTypeId')
        .where({
          'participantEndpoint.participantId': participantId,
          'participantEndpoint.isActive': 1,
          'et.name': endpointType
        }).select('participantEndpoint.*',
          'et.name')
    })
  } catch (err) {
    throw new Error(err.message)
  }
}

/**
 * @function GetAllEndpoints
 *
 * @async
 * @description This retuns all the active endpoints for a give participantId
 *
 *
 * @param {integer} participantId - the id of the participant in the database. Example 1
 *
 * @returns {array} - Returns an array containing the list of all active endpoints for the participant if successful, or throws an error if failed
 */

const getAllEndpoints = async (participantId) => {
  try {
    return Db.participantEndpoint.query(builder => {
      return builder.innerJoin('endpointType AS et', 'participantEndpoint.endpointTypeId', 'et.endpointTypeId')
        .where({
          'participantEndpoint.participantId': participantId,
          'participantEndpoint.isActive': 1
        }).select('participantEndpoint.*',
          'et.name')
    })
  } catch (err) {
    throw new Error(err.message)
  }
}


module.exports = {
  getEndpoint,
  getAllEndpoints,
}
