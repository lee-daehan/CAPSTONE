const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
app.use(methodOverride('_method'))
app.use(session({ secret: '비밀코드', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.0sp7tde.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
    if (error) { return console.log(error) };

    db = client.db('FootballMatchingapp');

    app.listen(8000, function () {
        console.log('listening on 8000');
    });
});

app.get('/', function (req, res) {
    res.render('home.ejs');
})


app.get('/editprofile', function (req, res) {
    res.render('editprofile.ejs');
});

//프로필 수정하기
app.get('/editprofile', function (req, res) {
    console.log(req.user);
    db.collection('profile').findOne({ _id: req.user._id }, function (error, result) {
        console.log(result);
        if (error) { return error };

        res.render('editprofile.ejs');
    })

})
//프로필 수정
app.put('/editprofile', function (req, res) {
    // 폼에담긴 제목데이터, 날짜데이터를 가지고 
    // db.collection에다가 업데이트함
    // console.log(req.user);
    db.collection('profile').updateOne({ _id: req.user._id }, {
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
        // console.log('수정완료');
        res.write("<script>alert('success')</script>");
        res.write("<script>window.location=\"../myprofile\"</script>");

    })

})

// 회원가입
app.get('/register', function (req, res) {
    res.render('register.ejs');
});

app.post('/register', function (req, res) {

    db.collection('profile').findOne({ id: req.body.id }, function (error, result) {
        if (result) {
            res.send('아이디 중복'); //아이디 중복
        } else {
            db.collection('profile').insertOne({
                id: req.body.id,
                pw: req.body.pw
            }, function (error, result) {
                if (error) { return error };
                res.write("<script>alert('success')</script>");
                res.write("<script>window.location=\"../login\"</script>");
            })
            db.collection('recommands').insertOne({
                id: req.body.id,
                성별: null,
                닉네임: null,
                선호포지션: null,
                주발: null,
                신장: null,
                몸무게: null
            }, function (error, result) {
                res.write("<script>alert('success')</script>");
            })
        }
    })
});

//로그인
app.get('/login', function (req, res) {
    res.render('login.ejs');
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function (req, res) {
    res.redirect('/')
});

app.get('/fail', function (req, res) {
    res.render('fail.ejs');
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (inputid, inputpw, done) {
    db.collection('profile').findOne({ id: inputid }, function (error, result) {
        if (error) return done(error)

        if (!result) return done(null, false, { message: '존재하지않는 아이디입니다.' })
        if (inputpw == result.pw) {
            return done(null, result)
        } else {
            return done(null, false, { message: '비밀번호가 일치하지 않습니다.' })
        }
    })
}));

//로그인 성공시 id 이용해서 세션을 저장시킴
passport.serializeUser(function (user, done) {
    done(null, user.id)
});

passport.deserializeUser(function (id, done) {
    db.collection('profile').findOne({ id: id }, function (error, result) {
        if (error) { return error };

        done(null, result)
    })
});

app.get('/mypage', checklogin, function (req, res) {
    // console.log(req.user);
    res.render('mypage.ejs', { User: req.user });
})

function checklogin(req, res, next) {
    if (req.user) {
        next();
    } else {
        res.send('로그인이 필요합니다.');
    }
}

//프로필 입력
app.get('/inputprofile', checklogin, function (req, res) {
    res.render('inputprofile.ejs');
});

app.post('/inputprofile', function (req, res) {
    // console.log(req.user);

    db.collection('profile').findOne({ _id: req.user._id }, function (error, result) {
        db.collection('profile').updateOne({ _id: req.user._id }, {
            $set:
            {
                닉네임: req.body.nickname,
                성별: req.body.gender,
                선호포지션: req.body.position,
                주발: req.body.foot,
                신장: req.body.height,
                몸무게: req.body.weight
            }
        }, function (error, result) { console.log('저장완료'); });
        
    });
    db.collection('recommands').updateOne({ id: req.user.id }, {
        $set:
        {   
            id: req.body.id,
            성별: null,
            닉네임: null,
            선호포지션: null,
            주발: null,
            신장: null,
            몸무게: null
        }
    }, function (error, result) { console.log('저장완료'); });
    //성공 알림창 띄우고 마이페이지로 돌아가게함 
    res.write("<script>alert('success')</script>");
    res.write("<script>window.location=\"../mypage\"</script>");
});

//내 프로필 보기
app.get('/myprofile', function (req, res) {
    // console.log(req.user);
    db.collection('profile').findOne({ _id: req.user._id }, function (error, result) {
        res.render('myprofile.ejs', { User: result });
    });
});

//게시판(board), 등록된 게시글 다 보이게 하는 기능
app.get('/board', function (req, res) {
    db.collection('board').find().toArray(function (error, result) {
        // 디비에 저장된 profile이라는 
        //collection 안의 모든 데이터를 꺼내주세요
        res.render('board.ejs', { User: result });
        //찾은걸 ejs파일에 집어넣어주세요.
    });
})

//내가 작성한 게시물 보기
app.get('/boardview', checklogin, function (req, res) {
    db.collection('board').find().toArray(function (error, result) {
        console.log(result);
        db.collection('board').findOne({ 작성자: req.user.id }, function (error, result2) {
            res.render('boardview.ejs', { allpost: result, writer: result2 });
        })

    });
});

//게시물 등록기능
//게시물을 검색한다. 검색한 내용에 맞는 경기를 DB에서 불러와 보여준다.

//게시글 등록기능
//게시글 작성하기 버튼을 만들어 게시글 등록 페이지로 이동,게시글을 작성해 자신의 프로필에 경기 내용을 저장한다.
app.get('/boardinput', function (req, res) {
    res.render('boardinput.ejs');
});

let today = new Date();
let date = today.getDate(); // 날짜구하기

app.post('/boardinput', checklogin, function (req, res) {
    console.log(req.user._id);
    db.collection('articlecounter').findOne({ name: '게시물갯수' }, function (error, result) {
        console.log(result);
        var totalPost = result.totalPost;

        // db.collection('board').insertOne({ _id: req.user._id }, function (error, result) {
        db.collection('board').findOne({ _id: req.user._id }, function (error, result) {
            db.collection('board').insertOne({
                _id: totalPost + 1,
                작성자: req.user.id,
                제목: req.body.title,
                게시글: req.body.board,
                경기진행날짜: req.body.date
            }, function (error, result) {
                db.collection('articlecounter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (error, result) {
                    if (error) { return console.log(error) };
                });
            });

        });
        // })
    });
    //성공 알림창 띄우고 마이페이지로 돌아가게함 
    res.write("<script>alert('success')</script>");
    res.write("<script>window.location=\"../board\"</script>");
});

//게시물 삭제
app.delete('/delete', function (req, res) {
    req.body._id = parseInt(req.body._id);
    db.collection('board').deleteOne(req.body, function (error, result) {
        if (error) { return res.status(400) } //요청 실패
        else { res.status(200).send({ message: '성공' }) } //요청 성공

    });
});

//게시물 수정
app.get('/editboard/:id', function (req, res) {
    db.collection('board').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        console.log(result);
        res.render('editboard.ejs', { post: result });
    })
});

app.put('/editboard', function (req, res) {
    db.collection('board').updateOne({ _id: parseInt(req.body.id) },
        {
            $set: {
                제목: req.body.title,
                게시글: req.body.content
            }
        }, function (error, result) {
            console.log('수정완료');
            res.redirect('/boardview');
        })
})


//원하는 경기 신청
app.put('/request', checklogin, function (req, res) {
    console.log(req.user.id); // 지금 로그인한 유저의 아이디
    req.body._id = parseInt(req.body._id)// 신청 버튼을 누른 게시글의 글번호
    db.collection('board').findOne({ _id: req.body._id }, function (error, result) {
        db.collection('request').insertOne({//request 콜렉션에 경기 신청자와 게시글 번호와 작성자,제목, 게시글을 삽입
            신청한게시물번호: req.body._id,
            제목: result.제목,
            게시글: result.게시글,
            신청자: req.user.id,
            작성자: result.작성자,
            여부: parseInt(0)
        });
    })
});

//신청내역 알림
app.get('/reqmatch', checklogin, function (req, res) {
    db.collection('request').find().toArray(function (error, result) {
        console.log(result);
        db.collection('request').findOne({ 작성자: req.user.id }, function (error, result2) {//누가 신청했는지 정보를 불러옴
            res.render('reqmatch.ejs', { allpost: result, writer: result2 });
        })

    });
})

//수락 확인
app.put('/accept', checklogin, function (req, res) {
    // console.log(req.user.id); // 지금 로그인한 유저의 아이디
    // console.log(req.body._id);
    const id = new mongoose.Types.ObjectId(req.body._id);
    db.collection('request').updateOne({ _id: id }, {
        $set: {
            여부: parseInt(1)
        }
    }, function (error, result) {
        console.log('수정완료');
        // res.redirect('/reqmatch');
    })
});


//거절 확인
app.put('/refuse', checklogin, function (req, res) {
    // console.log(req.user.id); // 지금 로그인한 유저의 아이디
    // console.log(req.body._id);
    const id = new mongoose.Types.ObjectId(req.body._id);
    db.collection('request').updateOne({ _id: id }, {
        $set: {
            여부: parseInt(2)
        }
    }, function (error, result) {
        console.log('수정완료');
        // res.redirect('/reqmatch');
    })
});

//신청한 경기
app.get('/resmatch', checklogin, function (req, res) {
    db.collection('request').find().toArray(function (error, result1) {
        db.collection('request').findOne({ 신청자: req.user.id }, function (error, result2) {
            res.render('resmatch.ejs', { 모든게시물: result1, 매칭된게시물: result2 });
        })
    })
})

//조건검색 & 추천
// app.post('/suggest', function (req, res) {

//     var gender = req.body.gender; // gender 자료형: String

//     db.collection('profile').find({ 성별: gender }).toArray(function (error, result) {
//         db.collection('recommands').insertOne({})
//         for (let i = 0; i <= gender.length; i++) {
//             db.collection('recommands').insertOne({
//                     suggest_id: result[i].id,
//                     닉네임: result[i].닉네임,
//                     성별: result[i].성별,
//                     선호포지션: result[i].선호포지션,
//                     주발: result[i].주발,
//                 })
//             }
//             res.render('index.ejs');
//         })
// })

// app.post('/suggest', function(req,res) {

//     var gender = req.body.gender; // gender 자료형: String
//     let id = [gender.length];

//     db.collection('profile').find({성별: gender}).toArray(function (error, result) {
//         for (let i = 0; i <= gender.length; i++) {
//             db.collection('recommands').insertOne({
//                     id: req.user.id,
//                     suggest_id: result[i].id,
//                     닉네임: result[i].닉네임,
//                     성별: result[i].성별,
//                     선호포지션: result[i].선호포지션,
//                     주발: result[i].주발,
//                 })
//             }
//             res.render('index.ejs');
//     })
// })
// app.put('/gender', function (req, res) {
//     db.collection('profile').find().toArray(function (error, result1) {
//         db.collection('recommands').findOne({ id: req.user.id }, function (error, result2) {
//             res.render('suggest.ejs', { allposts: result1, player: result2 });
//             console.log(allposts)
//             console.log(player)
//         })
//     })

// })
// app.get('/', function (req, res) {
//         db.collection('profile').find().toArray(function (error, result1) {
//             db.collection('recommands').findOne({ id: req.user.id }, function (error, result2) {
//                 res.render('index.ejs', {allpost: result1, player: result2 });
              
//             })
//         })
    
//     })

app.post('/recommand', function (req, res) {
    var gender = req.body.gender; // gender 자료형: String
        db.collection('recommands').updateOne({ id: req.user.id },
            {
                $set: {
                    성별: req.body.gender
                }
            }, function (error, result) {
                // console.log('수정완료');
            })
            res.write("<script>window.location=\"../suggest\"</script>");
})

app.get('/suggest',checklogin ,function(req, res){
    db.collection('recommands').findOne({id: req.user.id},function(error, result){
        // console.log(result.id);
        db.collection('profile').find({성별 : result.성별}).toArray(function(error, result2){
            console.log(result2.성별)
            res.render('index.ejs', {player: result2})
        })
    })
})



// app.get('/suggest', function(req,res){
//     db.collection('profile').find().toArray(function (error, result){

//     })
// })


// app.get('/suggest', function (req, res) {
//     db.collection('recommands').find({}).toArray(function (error, result) {

//     })
// })