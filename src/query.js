/*jshint esversion: 6 */
const dgram = require("dgram");
const EventEmitter = require("events");
const crypto = require("crypto");



/**
 * Class representing a server queries mocker.
 * @extends EventEmitter
 */
class QueryMocker extends EventEmitter {

    /**
     * Create a udp socket.
     * @param {number} port - Local socket port.
     * @param {object} options - Information which will be used.
    */

    constructor(port, info = {}) {
        super();
        // Set local udp port
        this._port = port;

        // Init datagram object instance
        this._server = dgram.createSocket("udp4");

        // Import requst types
        this._hex = require('./types/hex');
        this._string = require('./types/strings');
        this._options = require('./defaults/default').hlds;

        // Hex value of info
        this._hex_a2s_info_message = null;
        this._hex_a2s_player_message = null;
        this._hex_a2s_rules_message = null;

        // Challenge bytes
        this._clients = [];

        // Destruct options into info object
        this._info = {...this._options, ...info, }

    }

    /**
     * Start function. 
     * @description Bind local listen port
     * @exports
     * @returns {void}
    */
    start() {

        // Init error event dispatcher
        this._onError();

        // Parse incoming messages
        this._messageParser();

        // Start to listen for incoming messages
        this._listenSocket();

        // Check if A2S INFO hex messsage exists ?
        this._hex_a2s_info_message = this._hex_a2s_info_message !== null ? this._hex_a2s_info_message : this._A2S_INFO();

        // Check if A2S PLAYER hex messsage exists ?
        this._hex_a2s_player_message = this._hex_a2s_player_message !== null ? this._hex_a2s_player_message : this._A2S_PLAYER();

        // Check if A2S RULES hex messsage exists ?
        this._hex_a2s_rules_message = this._hex_a2s_rules_message !== null ? this._hex_a2s_rules_message : this._A2S_RULES();

        // Bind local port
        this._bindPort(this._port);

    }

    /** 
     * Error event listener
     * @description Listen for socket error events and closed socket on error
     * @fires QueryMocker#error
    */
    _onError() {
        this._server.on("error", (err) => {

            /**
             * Error event.
             *
             * @event QueryMocker#error
             * @type {Error}
             * @property {object} err - Error object
            */
            this.emit('error', err);
            this._closeSocket();
        });
    }

    /**
     * Function that listens for new data and parse data according to incoming data request
     * @returns {Buffer} Buffer data message
     */
    _messageParser() {

        // Listen for new messages
        this._server.on("message", (msg, info) => {

            // Transform array to string
            const requestHex = msg.toJSON().data.toString('');

            // A2S_INFO request handler
            if(requestHex === this._hex.A2S_INFO.request_header && this._hex_a2s_info_message !== null){

                // Send server information data
                this._server.send(this._hex_a2s_info_message, info.port, info.address); 
            }

            // A2S_PLAYER request without challenge
            if(requestHex === this._hex.A2S_PLAYER.request_header){
            
                // Check if this user have had already contacted us before?
                const clientExists = this._clients.find(client => client.ip === info.address && client.port === info.port);

                // Check 
                if(clientExists){
                    // If user exists send him old challenge
                    this._server.send(clientExists.challenge, info.port, info.address);
                }else{

                    // Buffer challenge
                    const challenge = this._createChallenge('player', info.address, info.port);

                    // If no send him new challenge request for player
                    this._server.send(challenge, info.port, info.address);
                }
            }

            // A2S_PLAYER request with challenge
            if(msg.toJSON().data[4] === 85 && requestHex !== this._hex.A2S_PLAYER.request_header && this._hex_a2s_player_message !== null){

                // Check if this user have had already contacted us before?
                const clientExists = this._clients.find(client => client.ip === info.address && client.port === info.port);
              
                // Check
                if(clientExists){

                    // User already has contacted us but is challenge equal to ours?
                    const isEqual = Buffer.compare(clientExists.challenge, msg.slice(5)) === 0;

                    // Check equality -
                    if(isEqual){

                        // If challenge is equal send response message
                        this._server.send(this._hex_a2s_player_message, info.port, info.address);
                    }
                }
            }
            

            // A2S_RULES request without challenge
            if(requestHex === this._hex.A2S_RULES.request_header){

                // Check if this user have had already contacted us before?
                const clientExists = this._clients.find(client => client.ip === info.address && client.port === info.port);

                // Check
                if(clientExists){

                    // If user exists send him old challenge
                    this._server.send(clientExists.challenge, info.port, info.address);
                }else{

                    // Buffer challenge
                    const challenge = this._createChallenge('rules');

                    // If no send him new challenge request for rules
                    this._server.send(challenge, info.port, info.address);
                }
            }


            // A2S_RULES request with challenge
            if(msg.toJSON().data[4] === 86 && requestHex !== this._hex.A2S_RULES.request_header && this._hex_a2s_rules_message !== null){
              
                // Check if this user have had already contacted us before?
                const clientExists = this._clients.find(client => client.ip === info.address && client.port === info.port);

                // Check
                if(clientExists){

                    // User already has contacted us but is challenge equal to ours?
                    const isEqual = Buffer.compare(clientExists.challenge, msg.slice(5)) === 0;

                    // Check equality
                    if(isEqual){

                        // If challenge is equal send response message
                        this._server.send(this._hex_a2s_rules_message, info.port, info.address);
                    }
                }
            }
        });
    }

    /**
     * Event listener for socket event 'listening'
     * @returns {void}
     */
    _listenSocket() {
        this._server.on("listening", () => {
            const address = this._server.address();
            console.log(`Server listening on ${address.address}:${address.port}`);
        });
    }

    /**
     * Bind socket port
     * @param {number} port 
     * @returns {void}
     */
    _bindPort(port) {
        this._server.bind(port);
    }

    /**
     * Function that closes socket instance
     *  @param {Function} crashFunction  A function to call when socket close is called                                
     * @fires QueryMocker#close
     * @returns {void}
     */
    _closeSocket(crash = process.exit.bind(process)){
        this._server.close(() =>{
            console.log('Server shutdown...');
            this.emit('close');
        })

        this._server = null;

        crash(1);
    }

    /**
     * Function returns crafted server info packet 
     * @returns {Buffer} 
     */
    _A2S_INFO(){

        // Craft packet - could use offset to skip this space 00 but who gives a fak
        const items = [
            Buffer.from(this._hex.A2S_INFO.response_header, 'hex'),
            Buffer.from(this._intToHex(this._info.protocol), 'hex'),
            Buffer.from(this._info.server_name),
            Buffer.from(this._hex.space, 'hex'),
            Buffer.from(this._info.map),
            Buffer.from(this._hex.space, 'hex'),
            Buffer.from(this._string.gamename),
            Buffer.from(this._hex.space, 'hex'),
            Buffer.from(this._info.server_description),
            Buffer.from(this._hex.space, 'hex'),
            Buffer.from(this._intToHex(this._info.appid), 'hex'),
            Buffer.from(this._hex.space, 'hex'),   
            Buffer.from(this._intToHex(this._info.server_players), 'hex'),
            Buffer.from(this._intToHex(this._info.server_maxplayers), 'hex'),
            Buffer.from(this._intToHex(this._info.bots), 'hex'),
            Buffer.from(this._info.type[0]),
            Buffer.from(this._info.os[0]),
            Buffer.from(this._intToHex(this._info.password), 'hex'),
            Buffer.from(this._intToHex(this._info.vac), 'hex'),
            Buffer.from(this._info.version),
            // Ignore EDF for now -.-'
            Buffer.from('00', 'hex')
           
        ];

        return this._hex_a2s_info_message = Buffer.concat(items);

    }

    /**
     * Function returns crafted server players packet 
     * @returns {Buffer} 
     */
    _A2S_PLAYER(){

        //+1 on length for those who count from 1
        if(this._info.players.length + 1 === parseInt(this._info.server_players)) { throw new Error('players number should be equal to length of players array')}
        const playernum = Buffer.from(this._intToHex(this._info.server_players), 'hex');

        let playersBuffer = [];

        this._info.players.forEach((player, index) => {

            const frags = Buffer.allocUnsafe(4);
            const seconds = Buffer.allocUnsafe(4);
            
            frags.writeUInt32LE(player.frags);
            seconds.writeFloatLE(player.seconds);

            const playerBuffer = Buffer.concat([
                Buffer.from(this._intToHex(index),'hex'),
                Buffer.from(player.nickname),
                Buffer.from(this._hex.space, 'hex'),
                frags,
                seconds
            ]);

            playersBuffer.push(playerBuffer);
        })

        const items = [
            Buffer.from(this._hex.A2S_PLAYER.response_player_header, 'hex'),
            playernum,
            Buffer.concat(playersBuffer)
        ];

        return this._hex_a2s_player_message = Buffer.concat(items);
    }
    
    /**
     * Function returns crafted rules info packet 
     * @returns {Buffer} 
     */
    _A2S_RULES(){

        const rulesnum = Buffer.from(this._intToHex(Object.keys(this._info.rules).length), 'hex');

        let rulesBuffer = [];

        for (const [key, value] of Object.entries(this._info.rules)) {
           
            const ruleBuffer = Buffer.concat([
                Buffer.from(this._hex.space, 'hex'),
                Buffer.from(key),
                Buffer.from(this._hex.space, 'hex'),
                Buffer.from(value)
            ]);

            rulesBuffer.push(ruleBuffer)
        }

        const items = [
            Buffer.from(this._hex.A2S_RULES.response_rules_header, 'hex'),
            rulesnum,
            Buffer.concat(rulesBuffer)
        ];

        return this._hex_a2s_rules_message = Buffer.concat(items);

    }

    /**
     * Function returns crafted server challenge and push it to the clients list
     * @param {string | null} type type of request which requires challenge
     * @param {string | null} ip Address of client
     * @param {string | null} port Port of client
     * @returns {Buffer | Error} 
     */

    _createChallenge(type, ip, port){

        const challenge = this._generateKey();

        switch (type) {
            case 'player':


                this._clients.push({
                    ip,
                    port,
                    challenge
                })

                return Buffer.concat([Buffer.from(this._hex.A2S_PLAYER.response_challenge_header, 'hex'), challenge]);

            case 'rules':

                this._clients.push({
                    ip,
                    port,
                    challenge
                })

                return Buffer.concat([Buffer.from(this._hex.A2S_RULES.response_challenge_header, 'hex'), challenge]);
    
            default:
                throw new Error('Bad type')
                
        }
    }

    /**
     * Functon which generates long type buffer
     * @returns {Buffer}
     */
    _generateKey(){
        return Buffer.from(crypto.randomBytes(4).toString('hex').toUpperCase(), 'hex');
    }

    /**
     * Function which converts int to hex - same function exists in node buffer api
     * @param {number | string} d 
     * @returns {string}
     */
    _intToHex(d) {
        let number = (+d).toString(16).toUpperCase()
        if((number.length % 2) > 0) { number= "0" + number }
        return number
    }   

}

module.exports = { QueryMocker };