# [DEPRECATED] interop-switch-js

## Deprecation Notice

Theis repo was deprecated as of November 2020. It is no longer maintained, and is no longer referenced by any releases of Mojaloop.

For a list of active Mojaloop repos, please refer to [Repo Details](https://docs.mojaloop.io/documentation/repositories/) section of the Mojaloop documentation.


Experimental Javascript implementation of the Interop-Switch component.
Developed for use with the cross-network POC (Reference).

Supported Endpoints:
* Parties
* Quotes


### Note:
Currently it is connecting to experimental endpoints on the central-ledger that only exist within the `cross-network` branch

### Usage:
To run the application use `npm run start`. This uses the default configuration file found in the config folder.
A different configuration can be specified by using the command `npm run start -- --config config/default_blue.json`. 
