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
 * @module src/domain/participant/
 */

const ParticipantModel = require('../../models/participant/participant')
const ParticipantFacade = require('../../models/participant/facade')


const participantExists = (participant) => {
  if (participant) {
    return participant
  }
  throw new Error('Participant does not exist')
}


/**
 * @function AddEndpoint
 *
 * @async
 * @description This adds the endpoint details for a participant
 *
 * ParticipantModel.getByName called to get the participant details from the participant name
 * ParticipantFacade.addEndpoint called to add the participant endpoint details
 *
 * @param {string} name - the name of the participant. Example 'dfsp1'
 * @param {object} payload - the payload containing 'type' and 'value' of the endpoint.
 * Example: {
 *      "type": "FSPIOP_CALLBACK_URL_TRANSFER_POST",
 *      "value": "http://localhost:3001/participants/dfsp1/notification12"
 * }
 * @returns {integer} - Returns number of database rows affected if successful, or throws an error if failed
 */

const addEndpoint = async (name, payload) => {
  try {
    const participant = await ParticipantModel.getByName(name)
    participantExists(participant)
    return ParticipantFacade.addEndpoint(participant.participantId, payload)
  } catch (err) {
    throw err
  }
}

/**
 * @function GetEndpoint
 *
 * @async
 * @description This retuns the active endpoint value for a give participant and type of endpoint
 *
 * ParticipantModel.getByName called to get the participant details from the participant name
 * ParticipantFacade.getEndpoint called to get the participant endpoint details
 *
 * @param {string} name - the name of the participant. Example 'dfsp1'
 * @param {string} type - the type of the endpoint. Example 'FSPIOP_CALLBACK_URL_TRANSFER_POST'
 *
 * @returns {array} - Returns participantEndpoint array containing the details of active endpoint for the participant if successful, or throws an error if failed
 */

const getEndpoint = async (name, type) => {
  try {
    const participant = await ParticipantModel.getByName(name)
    console.log('name', name, 'participant', participant)
    participantExists(participant)
    const participantEndpoint = await ParticipantFacade.getEndpoint(participant.participantId, type)
    return participantEndpoint
  } catch (err) {
    throw err
  }
}

/**
 * @function GetAllEndpoints
 *
 * @async
 * @description This retuns all the active endpoints for a give participant
 *
 * ParticipantModel.getByName called to get the participant details from the participant name
 * ParticipantFacade.getAllEndpoints called to get the participant endpoint details
 *
 * @param {string} name - the name of the participant. Example 'dfsp1'
 *
 * @returns {array} - Returns participantEndpoint array containing the list of all active endpoints for the participant if successful, or throws an error if failed
 */

const getAllEndpoints = async (name) => {
  try {
    const participant = await ParticipantModel.getByName(name)
    participantExists(participant)
    const participantEndpoints = await ParticipantFacade.getAllEndpoints(participant.participantId)
    return participantEndpoints
  } catch (err) {
    throw err
  }
}

/**
 * @function DestroyPariticpantEndpointByName
 *
 * @async
 * @description This functions deletes the existing endpoints for a given participant name
 * else, it will throw and error
 *
 * @param {string} name - participant name
 *
 * @returns {integer} - Returns the number of rows deleted if successful, or throws an error if failed
 */

const destroyPariticpantEndpointByName = async (name) => {
  try {
    const participant = await ParticipantModel.getByName(name)
    participantExists(participant)
    return ParticipantModel.destroyPariticpantEndpointByParticipantId(participant.participantId)
  } catch (err) {
    throw err
  }
}

module.exports = {
  participantExists,
  addEndpoint,
  getEndpoint,
  getAllEndpoints,
  destroyPariticpantEndpointByName,
}
