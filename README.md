# Query Mocker 

Query mocker is a node.js app which tries to mock a game server which supports [Valve server queries](https://developer.valvesoftware.com/wiki/Server_queries) for information gathering.

Currently it supports:
* A2S_INFO (still its exploitable by reflected ddos attack)
* A2S_PLAYER
* A2S_RULES

## Installation

Just download repository and run it with node.

## Usage

In `app.js` there is provided example of running app.js
First make an instance of object and there custom information can be passed which is used by code to make reponse packets.

Note: packets are not generated automatically by code. On code start craft functions are only called once.
All of dynamic content if needed, needs to be called by external function like `setInterval()` to update informations.


## Todos
See [issues](https://github.com/kallefrombosnia/query-mocker/issues).


## Issues
See [issues](https://github.com/kallefrombosnia/query-mocker/issues).

## License
App is made for legal purposes only under MIT License, dont abuse its features in any way.

[MIT](https://choosealicense.com/licenses/mit/)