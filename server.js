const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'))


var db;
MongoClient.connect('mongodb+srv://admin:@cluster0.0sp7tde.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
    if (error) { return console.log(error) };

    db = client.db('FootballMatchingapp');

    app.listen(8000, function () {
        console.log('listening on 8000');
    });
});

app.get('/', function (req, res) {
    res.render('index.ejs');
})

app.get('/mypage', function (req, res) {
    res.render('mypage.ejs');
});

app.get('/editprofile', function (req, res) {
    res.render('editprofile.ejs');
});

// app.get('/editprofile/:id', function(req, res) {
//     db.collection('profile').findOne({_id : parseInt(req.params.id)}, function(에러, 결과){
//         if(에러){ return 에러};
//         console.log(결과);
//         res.render('editprofile.ejs', {profile : result});
//     })

// });

//작성한 프로필 db에 저장
app.post('/editprofile', function (req, res) {
    db.collection('counter').findOne({ name: '프로필' }, function (error, result) {
        console.log(result.total);
        var Profile = result.total;
        db.collection('profile').insertOne({
            _id: Profile,
            닉네임: req.body.nickname,
            성별: req.body.gender,
            선호포지션: req.body.position,
            주발: req.body.foot,
            신장: req.body.height,
            몸무게: req.body.weight
        }, function (error, result) {
            db.collection('counter').updateOne({ name: '프로필' }, { $inc: { total: 1 } }, function (error, result) {
                if (error) { return console.log(error) };
            });
            console.log('저장완료');
        });
    });
    //성공 알림창 띄우고 마이페이지로 돌아가게함 
    res.write("<script>alert('success')</script>");
    res.write("<script>window.location=\"../mypage\"</script>");
    console.log(req.body.nickname);
});

//내 프로필 보기
app.get('/myprofile', function (req, res) {
    db.collection('profile').find().toArray(function (error, result) {
        console.log(result);
        res.render('myprofile.ejs', { profile: result });
    });
});

//프로필 수정하기
app.get('/editprofile/:id', function (req, res) {
    db.collection('profile').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        if (error) { return error };
        console.log(result);
        res.render('editprofile.ejs', { profile: result });
    })

})
app.put('/editprofile', function (req, res) {
    // 폼에담긴 제목데이터, 날짜데이터를 가지고 
    // db.collection에다가 업데이트함
    db.collection('profile').updateOne({ _id: parseInt(req.body.id) }, {
        $set:
        {
            닉네임: req.body.nickname,
            성별: req.body.gender,
            선호포지션: req.body.position,
            주발: req.body.foot,
            신장: req.body.height,
            몸무게: req.body.weight
        }
    }, function (error, result) {
        console.log('수정완료');
        res.redirect('/myprofile');//요청 성공시 페이지이동하게 해주는 코드
        //응답은 필수임 안하면 서버가 멈춤

    })

})
