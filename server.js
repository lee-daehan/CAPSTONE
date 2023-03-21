const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
app.use(bodyParser.urlencoded({ extended : true }));

var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.0sp7tde.mongodb.net/FootballMatchingapp?retryWrites=true&w=majority', function(error, client){
    if(error) {return console.log(error)};

    db = client.db('FootballMatchingapp'); 

    app.listen(8000, function(){
        console.log('listening on 8000');
    });
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
})

app.get('/mypage', function(req, res) {
    res.sendfile(__dirname + '/mypage.html');
});

app.get('/profile', function(req, res) {
    res.sendfile(__dirname + '/profile.html');
});

//작성한 프로필 db에 저장
app.post('/profile', function(req, res) {
    db.collection('profile').insertOne({
        닉네임: req.body.nickname,
        성별: req.body.gender,
        선호포지션: req.body.position,
        주발: req.body.foot,
        신장: req.body.height,
        몸무게: req.body.weight}, function(error, result){
            console.log('저장완료');
        });
    //성공 알림창 띄우고 마이페이지로 돌아가게함 
    res.write("<script>alert('success')</script>");
    res.write("<script>window.location=\"../mypage\"</script>");
    console.log(req.body.nickname);
});