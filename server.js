const express = require('express');
const app = express();

app.listen(8000, function(){
    console.log('listening on 8000');
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
})

app.get('/mypage', function(req, res) {
    res.sendfile(__dirname + '/mypage.html');
});