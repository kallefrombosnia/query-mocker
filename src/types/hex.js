module.exports = {
    A2S_INFO: {
        request_header: '255,255,255,255,84,83,111,117,114,99,101,32,69,110,103,105,110,101,32,81,117,101,114,121,0',
        response_header: 'ffffffff49', // ÿÿÿÿI
    },
    A2S_PLAYER:{
        request_header: '255,255,255,255,85,255,255,255,255',
        response_challenge_header: 'ffffffff41', // ÿÿÿÿA
        response_player_header: 'ffffffff44' // ÿÿÿÿD
    },
    A2S_RULES:{
        request_header: '255,255,255,255,86,255,255,255,255',
        response_challenge_header: 'ffffffff41', // ÿÿÿÿA
        response_rules_header: 'ffffffff45' // ÿÿÿÿE
    },
    space: '00', // ' '
}