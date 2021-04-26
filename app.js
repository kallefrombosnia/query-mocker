const {QueryMocker} = require('./src/query');

const hlds = new QueryMocker(27051, {
    map: 'de_test',
    server_players: 3
});


hlds.start();

setInterval(()=>{
   hlds._A2S_INFO() 
   hlds._A2S_PLAYER()
},10000)


