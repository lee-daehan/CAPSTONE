const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const fs = require('fs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');
const methodOverride = require('method-override');
const { count } = require('console');
const { type } = require('os');
app.use(methodOverride('_method'))
app.use(session({
    secret: '비밀코드', //암호 키 저장, 이 키를 통하여 Session id를 암호화
    resave: true, saveUninitialized: false, //재저장을 계속 할 것인지 정보, 세션에 변화가 없어도 계속 저장한다는 옵션
    cookie: { maxAge: (3.6e+6) * 24 } //세션 저장 만료 시간 설정 (24시간으로 설정)
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('views'));



var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.0sp7tde.mongodb.net/?retryWrites=true&w=majority', function (error, client) {
    if (error) { return console.log(error) };

    db = client.db('FootballMatchingapp');

    app.listen(8000, function () {
        console.log('listening on 8000');
    });
});

app.get('/', function (req, res) {
    var date = dateString;//현재날짜
    var place = "소운동장";
    console.log(date);
    db.collection('board').find({경기진행날짜: dateString, 장소:place}).toArray(function(error,result) {
        res.render('home.ejs', {dateKor:dateKor, date:date, result:result});
    })
})


app.get('/editprofile', function (req, res) {
    res.render('editprofile.ejs');
});

//프로필 수정하기
app.get('/editprofile', function (req, res) {
    console.log(req.user);
    db.collection('profile').findOne({ id: req.user.id }, function (error, result) {
        console.log(result);
        if (error) { return error };

        res.render('editprofile.ejs');
    })

})
//프로필 수정
app.put('/editprofile', function (req, res) {
    db.collection('profile').updateOne({ id: req.user.id }, {
        $set:
        {
            닉네임: req.body.nickname,
            성별: req.body.gender,
            선호포지션: req.body.position,
            주발: req.body.foot,
        }
    }, function (error, result) {
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
                pw: req.body.pw,
                이름: req.body.name,
                닉네임: req.body.nickname,
                학과 : req.body.department,
                생일 : req.body.birthdate,
                성별 : req.body.identityGender,
                선호포지션: req.body.position,
                주발: req.body.foot
            }, function (error, result) {
                if (error) { return error };
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                res.write("<script>alert('회원가입이 완료되었습니다.')</script>");
                return res.write("<script>window.location=\"../login\"</script>");
            })

            db.collection('recommands').insertOne({
                id: req.body.id,
                성별: null,
                선호포지션: null,
                주발: null
            });
            db.collection('evaluate').insertOne({
                평가받은사람: req.body.id,
                점수준사람: null,
                점수: 0,
                count: 0
            });

            db.collection('invite').insertOne({
                id: req.body.id,
                초대받은사람: null,
                게시글번호: null
            }, function (error, result) {
                res.write("<script>alert('success')</script>");
            })

            db.collection('work').insertOne({
                id: req.body.id,
                other: null,
                게시글번호: null
            })
            db.collection('addmatch').insertOne({
                id: req.body.id,
                date: null,
                place: null
            })
            db.collection('boardwrite').insertOne({
                id: req.body.id,
                place: null,
                date: null,
                time: null
            })
            db.collection('duplication').insertOne({
                id: req.body.id,
                duplication: null,
                art_id: null,
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

//로그아웃
app.get('/logout', (req, res) => {
    req.logOut(function (error, result) {
        req.session.save(function (err) {
            if (err) throw err;
            res.render('logout.ejs')
        })
    });
})

app.get('/mypage', checklogin, function (req, res) {
    db.collection('profile').findOne({id: req.user.id}, function(error, result){
        db.collection('evaluate').findOne({평가받은사람: req.user.id} ,function(error, score){
            res.render('mypage.ejs', { user : result, score: score, avg: parseFloat(parseFloat(score.점수)/score.count) });
        })
    })
})

function checklogin(req, res, next) {
    if (req.user) {
        next();
    } else {
        // res.write("<script>alert('please login')</script>");
        // res.write("<script>window.location=\"../login\"</script>");
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.write("<script>alert('로그인을 해주세요.')</script>");
        return res.write("<script>window.location=\"../login\"</script>");
    }
}

//프로필 입력
app.get('/inputprofile', checklogin, function (req, res) {
    res.render('inputprofile.ejs');
});

app.post('/inputprofile', function (req, res) {
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
    })
    res.write("<script>alert('success')</script>");
    res.write("<script>window.location=\"../mypage\"</script>");
});

//내 프로필 보기
app.get('/myprofile', checklogin, function (req, res) {
    // console.log(req.user);
    db.collection('profile').findOne({ _id: req.user._id }, function (error, result) {
        res.render('myprofile.ejs', { User: result });
    });
});



// app.post('/select1', function (req, res) {
//     db.collection('matchselect').deleteMany({})
//     db.collection('board').find({ 인원: req.body.select }).toArray(function (error, result) {
//     for (var i = 0; i < result.length; i++) {
//     db.collection('matchselect').insertOne({
//         _id: result[i]._id,
//         id: req.user.id,
//         경기진행날짜: req.body.date,
//         작성자: result[i].작성자,
//         제목: result[i].제목,
//         게시글: result[i].게시글,
//         장소: result[i].장소,
//         인원: result[i].인원,
//         남은인원: result[i].count
//     })
//     }
//     })
    
//     res.write("<script>window.location=\"../board\"</script>");
// })

// app.post('/select2', function (req, res) {
//     db.collection('matchselect').find({ 장소: req.body.area }).toArray(function (error, result) {
//     if(req.body.area == '대운동장 풋살장(농구골대 옆)'){
//         for(var i=0 ; i<result.length; i++){
//             db.collection('matchselect').remove({장소: '소운동장'});
//             db.collection('matchselect').remove({장소: '대운동장 풋살장(체육관 옆)'});
//         }
//     }else if(req.body.area == '소운동장'){
//         for(var i=0 ; i<result.length; i++){
//             db.collection('matchselect').remove({장소: '대운동장 풋살장(농구골대 옆)'});
//             db.collection('matchselect').remove({장소: '대운동장 풋살장(체육관 옆)'});
//         }
//     }else if(req.body.area == '대운동장 풋살장(체육관 옆)'){
//         for(var i=0 ; i<result.length; i++){
//             db.collection('matchselect').remove({장소: '소운동장'});
//             db.collection('matchselect').remove({장소: '대운동장 풋살장(농구골대 옆)'});
//         }
//     }

   
//     })
    
//     res.write("<script>window.location=\"../board\"</script>");
// })

//게시판(board), 등록된 게시글 다 보이게 하는 기능
app.get('/board', function (req, res) {
    db.collection('board').find().toArray(function(error,result){
        res.render('board.ejs', { board: result});
    })
        // db.collection('matchselect').find().toArray(function (error, result) {
        // });
            
})

//내가 작성한 게시물 보기
app.get('/boardview', checklogin, function (req, res) {
    db.collection('board').find().toArray(function (error, result) {
        db.collection('board').findOne({ 작성자: req.user.id }, function (error, result2) {
                if(result2 == null){
                    res.render('boardview.ejs',{ allpost: result, writer: result2 });
                }
                if(result2 != null){
                    res.render('boardview.ejs', { allpost: result, writer: result2 });
                }
        })
    });
});



//게시물 등록기능
//게시물을 검색한다. 검색한 내용에 맞는 경기를 DB에서 불러와 보여준다.

//게시글 등록기능
//게시글 작성하기 버튼을 만들어 게시글 등록 페이지로 이동,게시글을 작성해 자신의 프로필에 경기 내용을 저장한다.

app.post('/boardwrite', function(req, res){
    console.log(req.body.place);
    console.log(req.body.date);
    console.log(req.body.time);

    db.collection('boardwrite').updateOne({id:req.user.id}, {
        $set:
        {
            place: req.body.place,
            date: req.body.date,
            time: req.body.time
        }
    })
    res.write("<script>window.location=\"../boardinput\"</script>");
})

app.get('/boardinput', checklogin, function (req, res) {
    db.collection('boardwrite').findOne({id:req.user.id}, function(error, result){
        res.render('boardinput.ejs', {result: result});
    })
});

app.post('/boardinput', checklogin, function (req, res) {
    db.collection('articlecounter').findOne({ name: '게시물갯수' }, function (error, result) {
        var totalPost = result.totalPost; 
        if (req.body.matchcount === '5vs5') {
            var totalCount = 9;
        }
        if (req.body.matchcount === '6vs6') {
            var totalCount = 11;
        }
        if (req.body.matchcount === '8vs8') {
            var totalCount = 15;
        }
        db.collection('profile').findOne({id:req.user.id}, function(error, result1){
            db.collection('board').insertOne({
            _id: totalPost + 1,
            작성자: req.user.id,
            작성자닉네임: result1.닉네임,
            제목: req.body.title,
            게시글: req.body.board,
            장소: req.body.place,
            인원: req.body.matchcount,
            경기진행날짜: req.body.date,
            경기진행시간: req.body.matchtime,
            count: totalCount
        }, function (error, result) {
            // console.log(typeof req.body.matchtime);
            db.collection('articlecounter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (error, result2) {
                if (error) { return console.log(error) };
            });
        });
        })
        
        
    });
    //마이페이지로 돌아가게함
    res.write("<script>window.location=\"../\"</script>");
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
app.get('/editboard/:id', checklogin, function (req, res) {
    db.collection('board').findOne({ _id: parseInt(req.params.id) }, function (error, result) {
        res.render('editboard.ejs', { post: result });
    })
});

app.put('/editboard', checklogin, function (req, res) {
    db.collection('board').updateOne({ _id: parseInt(req.body.id) },
        {
            $set: {
                제목: req.body.title,
                게시글: req.body.content,
                장소: req.body.place,
                인원: req.body.matchcount,
                경기진행날짜: req.body.date,
                경기진행시간: req.body.matchtime
            }
        }, function (error, result) {
            console.log('수정완료');
            res.redirect('/boardview');
        })
})

//원하는 경기 신청
//이건 지울 부분, 메인페이지에서만 이제 신청을 진행할거라 전체 메치 눌러서 가는건 안함
// app.put('/request', checklogin, function (req, res) {
//     console.log(req.user.id); // 지금 로그인한 유저의 아이디
//     req.body._id = parseInt(req.body._id)// 신청 버튼을 누른 게시글의 글번호
//     console.log(req.body._id)
//     db.collection('board').findOne({ _id: req.body._id }, function (error, result) {
//         db.collection('profile').findOne({id: req.user.id}, function(error,result2){
//             db.collection('request').insertOne({//request 콜렉션에 경기 신청자와 게시글 번호와 작성자,제목, 게시글을 삽입
//                 신청한게시물번호: req.body._id,
//                 제목: result.제목,
//                 게시글: result.게시글,
//                 신청자: req.user.id,
//                 이름 : result2.이름,
//                 성별: result2.성별,
//                 선호포지션: result2.선호포지션,
//                 주발: result2.주발,
//                 작성자: result.작성자,
//                 경기진행날짜: result.경기진행날짜,
//                 경기진행시간: result.경기진행시간,
//                 장소: result.장소,
//                 인원: result.인원,
//                 남은인원: result.count,
//                 여부: parseInt(0),
//                 평가여부: parseInt(0)
//             })
//         })
//     })
// });


var all_id;
app.post('/request2', checklogin, function(req, res) {
    var reqid = parseInt(req.body._id)// 신청 버튼을 누른 게시글의 글번호
    var host = req.body.host// 신청 버튼을 누른 게시글의 작성자id
    all_id = parseInt(req.body._id);

    //이미 초대 받았을 경우 start
    // db.collection('request').findOne({신청한게시물번호:art_id, 초대한사람: host,초대받은사람: req.user.id}, function(error,result){
    //     if(result != null){
    //         console.log("443-result:" + result.신청한게시물번호 +" ," + result.초대받은사람 )//잘 가져옴
    //         db.collection('duplication').updateOne({ id: req.user.id }, {
    //             $set:
    //             {
    //                 duplication: 1, //1이면 초대 받았을때,
    //                 art_id:art_id  //초대받았을때 어떤 게시글이 초대 받은건지
    //             }
    //         })
    //     } else {
    //         console.log("454 none");
    //     }
    //}) //이미 초대 받았을경우 end

    //이미 신청/ 초대 받았을 경우 start
    // db.collection('requset').findOne({신청한게시물번호: reqid, 신청자:req.user.id}, function(eroor,result) {
    //     console.log(result)
    //       db.collection('duplication').updateOne({ id: req.user.id }, {
    //             $set:
    //             {
    //                 duplication: 2, //1이면 이미 신청 / 초대 받은 게시글이 있을때
    //                 art_id: reqid
    //             }
    //         }, function(error,result) {
    //             return res.write("<script>window.location=\"../\"</script>");
    //         })  
    // })
    
    
    //처음 신청하는 경우
    db.collection('duplication').findOne({id:req.user.id}, function(eroor,result) {
        if(result.art_id != reqid) {
            db.collection('board').findOne({ _id: reqid }, function (error, result) {
                db.collection('profile').findOne({id: req.user.id}, function(error,result2){
                    db.collection('request').insertOne({//request 콜렉션에 경기 신청자와 게시글 번호와 작성자,제목, 게시글을 삽입
                                신청한게시물번호: reqid,
                                제목: result.제목,
                                게시글: result.게시글,
                                신청자: req.user.id,
                                이름 : result2.이름,
                                성별: result2.성별,
                                선호포지션: result2.선호포지션,
                                주발: result2.주발,
                                작성자: result.작성자,
                                경기진행날짜: result.경기진행날짜,
                                경기진행시간: result.경기진행시간,
                                장소: result.장소,
                                인원: result.인원,
                                남은인원: result.count,
                                여부: parseInt(0),
                                평가여부: parseInt(0)
                    })
                })
            })
            db.collection('duplication').updateOne({ id: req.user.id }, {
                $set:
                {
                    duplication: 2, //신청을하고 2로 바꿔줌
                    art_id: reqid
                }
            })
        }     
    })
})
////////////////////////////////////신청 중복 방지 start //////////////////////////////////////////


app.get('/appresult', function (req, res) {
    db.collection('duplication').findOne({ id: req.user.id }, function (error, result) {
        console.log("681-result:" + result.duplication + result.art_id)
        console.log(all_id);
        if (result.duplication == 2 && result.art_id == all_id) {
            // db.collection('duplication').updateOne({ id: req.user.id }, {
            //     $set:
            //     {
            //         duplication: 1, //3이면 이미 신청한 게시글이 있을때
            //         art_id: art_id
            //     }
            // })
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.write("<script>alert('이미 신청한 매치입니다.')</script>");
            return res.write("<script>window.location=\"../\"</script>");
        }
        else { 
            db.collection('duplication').updateOne({ id: req.user.id }, {
                $set:
                {
                    duplication: 2, //3이면 이미 신청한 게시글이 있을때
                    art_id: all_id
                }
            })
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.write("<script>alert('신청완료.')</script>");
            return res.write("<script>window.location=\"../\"</script>");
         }
       
    })
})


// app.post('/request2', checklogin, function (req, res) {//메인페이지의 날짜 선택해서 request컬렉션에 inserOne하는 부분, 신청전에 초대를 이미 받아서 매칭요청이 왔는지 중복검사해야함
//     //반대로 신청할 땐 신청하려는데 내가 이미 초대를 받았을 경우가 있음, 그럼 신청 눌렀을때 request컬렉션에서 비교해줘야 중복이 안발생함
//     var art_id = parseInt(req.body._id)// 신청 버튼을 누른 게시글의 글번호
//     var host = req.body.host// 신청 버튼을 누른 게시글의 작성자id
//     // console.log(req.user.id); // 지금 로그인한 유저의 아이디
//     console.log(art_id);
//     console.log(host);
//     // res.write("<script>window.location=\"../board\"</script>");//지금 박는거 주석해놔서 안박히는거임 놀라지 말자

//     // db.collection('request').findOne({초대한사람: host,초대받은사람: req.user.id,신청한게시물번호:art_id},function(error,result){

//     //     if(result != null){
//     //         console.log(result);//result.length는 undefined, parseInt(result.length)는 NaN으로 뜸 if로 조건 걸려면 null로 해야함
//     //         console.log('중복되는게 있어요')
//     //         res.write("<script>window.location=\"../double\"</script>");
//     //     }
//     //     if(result == null){
//     //         console.log(result);
//     //         console.log('신청되었습니다')
//     //     }
//     // })

//     db.collection('request').findOne({초대한사람: host,초대받은사람: req.user.id,신청한게시물번호:art_id},function(error,result){
//         if(result != null){
//             console.log(result)//잘 가져옴
//             // console.log("중복된 게시글이 있습니다.")//중복된 게시글 있는거 확인가능
//             // res.send('이미 이 경기에 초대되셨습니다.')
//             //list.ejs의 window.reload때문에 duplication으로 이동 못하는거 아님
//             // res.write("<script>location.href='/duplication'</script>");
//             // res.location('/duplication.ejs')
//             // res.send('')
//             // alert('이미 이 경기에 초대되셨습니다');
//             // res.send(
//                 //     `<script>
//                 //       alert('이메일 인증 시간을 초과했습니다.');
//                 //       location.href='${"/duplication.ejs"}';
//                 //     </script>`
//                 //   );
//                 // res.send("<script>alert('알림 창입니다.');location.href='/duplication';</script>");
//             }
//             if(result == null){
//                 //아래 findOne 위에부터 감싸서 조건 걸어주자, db.collection('request').findOne({신청한게시물번호: art_id, 신청자:, 작성자: host})
//                 db.collection('board').findOne({ _id: art_id }, function (error, result) {
//                     db.collection('profile').findOne({id: req.user.id}, function(error,result2){
//                         db.collection('request').insertOne({//request 콜렉션에 경기 신청자와 게시글 번호와 작성자,제목, 게시글을 삽입
//                             신청한게시물번호: art_id,
//                             제목: result.제목,
//                             게시글: result.게시글,
//                             신청자: req.user.id,
//                             이름 : result2.이름,
//                             성별: result2.성별,
//                             선호포지션: result2.선호포지션,
//                             주발: result2.주발,
//                             작성자: result.작성자,
//                             경기진행날짜: result.경기진행날짜,
//                             경기진행시간: result.경기진행시간,
//                             장소: result.장소,
//                             인원: result.인원,
//                             남은인원: result.count,
//                             여부: parseInt(0),
//                             평가여부: parseInt(0)
//                     })
//                     })
//                 })
//             }
//         })
// });

// // app.post('/request2', checklogin, function (req, res, done) {
// //     var art_id = parseInt(req.body._id)// 신청 버튼을 누른 게시글의 글번호
// //     var host = req.body.host// 신청 버튼을 누른 게시글의 작성자id
// //     console.log(art_id);
// //     console.log(host);

// //     // function (inputid, inputpw, done) {
// //     //     db.collection('profile').findOne({ id: inputid }, function (error, result) {
// //     //         if (error) return done(error)
    
// //     //         if (!result) return done(null, false, { message: '존재하지않는 아이디입니다.' })
// //     //         if (inputpw == result.pw) {
// //     //             return done(null, result)
// //     //         } else {
// //     //             return done(null, false, { message: '비밀번호가 일치하지 않습니다.' })
// //     //         }
// //     //     })

// //     db.collection('request').findOne({초대한사람: host,초대받은사람: req.user.id,신청한게시물번호:art_id},function(error,result){
// //         // console.log(result) //잘 넘어옴
// //         if(result.초대받은사람 == req.user.id && result.신청한게시물번호 == art_id && result.초대한사람 == host)
// //         return done(null,null, {message: '이미 초대받은경기입니다.'})
// //         // {
// //         //     // console.log("중복") //중복 확인 잚됨
// //         //     // res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
// //         //     // res.write("<script>alert('이미 초대받은 매치입니다.');</script>");
// //         //     // return res.write("<script>window.location=\"../mypage\"</script>");
// //         //         res.send(html);
// //         // }
// //         if(result == null){
// //                 //아래 findOne 위에부터 감싸서 조건 걸어주자, db.collection('request').findOne({신청한게시물번호: art_id, 신청자:, 작성자: host})
// //                 db.collection('board').findOne({ _id: art_id }, function (error, result) {
// //                     db.collection('profile').findOne({id: req.user.id}, function(error,result2){
// //                         db.collection('request').insertOne({//request 콜렉션에 경기 신청자와 게시글 번호와 작성자,제목, 게시글을 삽입
// //                             신청한게시물번호: art_id,
// //                             제목: result.제목,
// //                             게시글: result.게시글,
// //                             신청자: req.user.id,
// //                             이름 : result2.이름,
// //                             성별: result2.성별,
// //                             선호포지션: result2.선호포지션,
// //                             주발: result2.주발,
// //                             작성자: result.작성자,
// //                             경기진행날짜: result.경기진행날짜,
// //                             경기진행시간: result.경기진행시간,
// //                             장소: result.장소,
// //                             인원: result.인원,
// //                             남은인원: result.count,
// //                             여부: parseInt(0),
// //                             평가여부: parseInt(0)
// //                     })
// //                     })
// //                 })
// //             }
// //         })
// // });



app.get('/appresult', function(req,res){
    res.render('appresult.ejs');
})

//신청내역 알림
app.get('/reqmatch', checklogin, function (req, res) {
    db.collection('request').find({ 작성자: req.user.id }).toArray(function (error, result) {
        console.log(result.length)
        if (result.length == 0) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.write("<script>alert('신청받은 경기가 없습니다.')</script>");
            return res.write("<script>window.location=\"../mypage\"</script>");
        }
        if (result != null) {
            return res.render('reqmatch.ejs', { allpost: result })
        }
    })
})

//수락 확인
app.put('/accept', checklogin, function (req, res) {
    const id = new mongoose.Types.ObjectId(req.body._id.id);
    const count = parseInt(req.body._id.articlenum) // 신청한게시물번호
    console.log(req.body._id.articlenum)
    console.log(req.body._id.id)

    db.collection('request').updateOne({ _id: id }, {
        $set: {
            여부: parseInt(1)
        }
    }, function (error, result) {
        db.collection('board').updateOne({ _id: count }, { $inc: { count: -1 } }, function (error, result) {
            if (error) { return console.log(error) };
        })
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

//신청한 경기, 신청한 경기에서 매칭완료된거 점수 주면 request디비에서 삭제를 시킴 board에서 게시글이 지워지는거 아님 걱정 ㄴㄴ
app.get('/resmatch', checklogin, function (req, res) {
    db.collection('work').findOne({ id: req.user.id }, function (error, result1) {
        db.collection('request').findOne({ 신청자: req.user.id, 작성자: result1.other, }, function (error, result2) {
            db.collection('request').deleteOne({ 평가여부: 1 });
        })
    })
    //위에 내용은 신청한 경기에 한하여 신청자가 경기 작성자를 평가하고 평가여부가 1이 되었을때 request컬렉션에서 삭제하는것, 다행히 해당 컬렉션에 게시글 번호가 박혀있어 따로따로 삭제가 가능함

    //회원가입할때 work컬렉션에 게시글 번호도 박히게 해야함
    //내가 하려는건 신청하거나 신청 받았거나 초대 하거나 초대 받았거나 매칭이 완료가 되서 날짜비교(여기서하는거 아님)해서 경기 날이 지났으면 이미 경기를 한걸로 간주
    //그 후에 점수를 평가하는 것이기 때문에 evaluate.ejs페이지에 같이 뛴 유저들을 평가할 수 있도록 출력, 거기서 평가하러 가기 버튼이든 링크든 클릭하면
    // before_ev경로로 post요청해서 update(클릭한 유저id값은 = work컬렉션의 other에 업데이트, 클릭한 게시글번호는 = work컬렉션의 게시글번호에 업데이트)
    //score페이지로 이동, score페이지에서 평가 받은 사람의 id값과 점수값을 apply경로로 넘김, 점수를 evaluate컬렉션에 업데이트할 땐 게시글 번호 안필요함
    //work에 게시글 번호를 박은 이유는 만약 내가 방금 누군가를 평가했다면 request컬렉션 또는 inviteList컬렉션에 평가여부가 1인 녀석이면서 내가 누른 게시글의 번호 값을 가져와야 평가완료하고
    //request,inviteList컬렉션에서 deleteOne을 할 수 있음 board를 지우는게 아님 이런 완료된 경기의 요청들을 지워야 함,
    //삭제하는건 이따 해보고 일단 evaluate에 매칭완료 되었고 현재 날짜랑
    //비교해서 지난 경기들이면 출력이 가능하고 평가하러 갈 수 있게끔 화면에 띄어주는거 하면됨

    db.collection('request').find().toArray(function (error, result1) {
        db.collection('request').findOne({ 신청자: req.user.id }, function (error, result2) {
            if (result2 == null) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                res.write("<script>alert('신청한경기가 없습니다.')</script>");
                res.write("<script>window.location=\"../mypage\"</script>");
            }
            if (result2 != null) {
                res.render('resmatch.ejs', { 모든게시물: result1, 매칭된게시물: result2 });
            }

        })
    })
})

//조건검색 & 추천
app.post('/recommand', checklogin, function (req, res) {
    console.log(req.body.gender)
    console.log(req.body.position)
    console.log(req.body.foot)
    db.collection('recommands').updateOne({ id: req.user.id },
        {
            $set:
            {
                성별: req.body.gender,
                선호포지션: req.body.position,
                주발: req.body.foot
            }
        }, function (error, result) {
            // console.log('수정완료');
        })
    res.write("<script>window.location=\"../suggest\"</script>");
})

// app.get('/suggest', checklogin, function (req, res) {
//     db.collection('recommands').findOne({ id: req.user.id }, function (error, result) {
//         db.collection('profile').find({ 성별: result.성별, 선호포지션: result.선호포지션, 주발: result.주발 }).toArray(function (error, result1) {
//             res.render('suggest.ejs', { player: result1, host: req.user.id })
//         })
//     })
// })

app.get('/suggest', checklogin, function (req, res) {
    var date = dateString;//현재날짜
    var place = "소운동장";
    db.collection('board').find({경기진행날짜: dateString, 장소:place}).toArray(function(error,result１) {
        db.collection('recommands').findOne({ id: req.user.id }, function (error, result) {
            db.collection('profile').find({ 성별: result.성별, 선호포지션: result.선호포지션, 주발: result.주발 }).toArray(function (error, result1) {
                res.render('suggest.ejs', { player: result1, host: req.user.id,dateKor:dateKor, date:date, result:result１ })
            })
        })
    })
})

app.post('/apply', checklogin, function (req, res) {
    //req.body.id는 평가 받은 사람 값임
    //score페이지에서 점수를 받는 사람의 id값과 점수 값을 가져옴
    
    var articlenum = req.body.articlenum
    console.log(parseInt(articlenum)+"제대로뜨나")
    db.collection('evaluate').findOne({평가받은사람: req.body.id}, function(error,result){
        db.collection('evaluate').updateOne({평가받은사람: req.body.id},{
            $set:
            {
                점수: result.점수 + parseInt(req.body.rate)
            } 
        }, function (error, result){
           db.collection('evaluate').updateOne({평가받은사람:req.body.id}, { $inc: { count: +1 } }, function(error, result){
                if (error) { return console.log(error) };
           })
        })
    })//점수 주는 과정

    // 점수 줬으니 평가여부 바꾸는 과정, 중복제거도 할 수 있게 평가여부를 request의 두가지 경우와 inviteList의 두가지 경우를 조건검색해서 있다면 평가여부를 1로 바꿔야 중복 제거가능
    // 중복 없으면 없는대로도 실행 가능, 없다면 조건이 안맞으면 실행을 안시키니까 문제 없
    db.collection('work').findOne({id: req.user.id},function(error,result){
        // 내가 신청했을때
        db.collection('request').updateOne({작성자:req.body.id , 신청자: req.user.id, 신청한게시물번호: parseInt(result.게시글번호)},{
            $set: {
                평가여부: parseInt(1)
            }
        })
        // //내가 신청 받았을 때
        // db.collection('request').updateOne({작성자:req.user.id , 신청자: req.body.id, 신청한게시물번호: parseInt(result.게시글번호)},{
        //     $set: {
        //         평가여부: parseInt(1)
        //     }
        // })
        //내가 초대했을때
        // db.collection('request').updateOne({초대한사람:req.user.id , 초대받은사람: req.body.id, 신청한게시물번호: parseInt(result.게시글번호)},{
        //     $set: {
        //         평가여부: parseInt(1)
        //     }
        // })
        //내가 초대받았을때
        db.collection('request').updateOne({초대한사람:req.body.id , 초대받은사람: req.user.id, 신청한게시물번호: parseInt(result.게시글번호)},{
            $set: {
                평가여부: parseInt(1)
            }
        })
    })
    
    //중복 문제 해결, 내가 초대한거, 내가 신청 받은거가 중복이 일어날 경우가 있음
    // db.collection('request').updateOne({작성자:req.user.id , 신청자: req.body.id, 신청한게시물번호: articlenum},{
    //     $set: {
    //         평가여부: parseInt(1)
    //     }
    // })
})





// app.get('/board2', checklogin, function(req,res) {
//     console.log(req.body.art_id);
// })

app.post('/invite', function(req,res){
    var invited_id = req.body.id; //초대받는 사람의 아이디
    console.log(invited_id);
        db.collection('invite').updateOne({ id: req.user.id }, {//invite컬렉션(메인페이지에서 조건검색으로 추천받은 유저 초대할때)은 inviteList의 값을 바꾸기 위해 사용하는 값이다.
            $set:
            {
                초대받은사람: invited_id
            }
        }, function (error, result) {})
});


app.get('/boardview2', checklogin, function (req, res) {
        // db.collection('board').find().toArray(function (error, result) {
        //     db.collection('board').findOne({ 작성자: req.user.id }, function (error, result2) {
        //         res.render('boardview2.ejs', {allpost: result, writer: result2});
        //     })
        // });
        db.collection('invite').findOne({id: req.user.id},function(error,result){
            db.collection('request').find({신청자: result.초대받은사람, 작성자:req.user.id, 여부: 0}).toArray(function(error,result2){
                // console.log(result2);//신청받은경기가 있는거 한개면 한개대로, 여러개면 여러개대로 잘 가져옴
                db.collection('board').find({작성자: req.user.id}).toArray(function(error,result3){
                    //console.log(result3)
                    db.collection('request').find({초대한사람: req.user.id, 초대받은사람: result.초대받은사람}).toArray(function(error,result4){
                        console.log(result4)
                        res.render('boardview2.ejs',{duplication: result2, allpost: result3})
                    })
                })

            })
        })
    });

app.post('/invite2', function(req,res){//boardview2.ejs에서 ajax로 보내오는 경로
    var art_num = parseInt(req.body.postNum); //게시글번호
    db.collection('invite').updateOne({ id: req.user.id }, {//여기서 최종적으로 invite컬렉션엔 초대한사람id, 초대받은사람id, 선택한게시물번호가 업데이트 다 완료가 됨
        $set:
        {
            게시글번호: art_num
        }
    }, function (error, result) {    
        db.collection('invite').findOne({id:req.user.id},function(error,result){
            // console.log(result); 클릭한값들 다 제대로 들어감

        })
    })

    // db.collection('request').findOne({})
    
    
    
    
    
    //근데 중요한건 초대를 하려는데 이미 초대받은 사람이 나한테 신청을 했어서 똑같은 게시글에 매칭이 완료된 상태라면 중복이 발생하지 않게끔 해줘야함
    //그래서 여기 function에서 조건을 걸어서 막아야함, invite컬렉션에서 값을 읽어오고 request컬렉션에서 비교해아함,신청자: 초대받은사람, 작성자: id, 신청한게시물번호: 게시글번호 
    //위의 형식에 맞게 비교를해서 만약 request컬렉션에서 읽어온 값 result가 null이 아니라면 값을 읽어왔다는 의미(이미 매칭 신청이 왔던거임, 매칭 여부는 여기서 조건으로 안걸어도됨)
    //그냥 중복만 안되게 하려고 하는거니까(여부가 0이든 1이든 2이든 이미 신청받아서 대기중인거고 완료된거고 거절된거여도 request컬렉션엔 같은게 박히면 안됨)
    //다 평가하고 result가 null이라면 아무 반응 안해줘도 됨 근데 null이 아니라면 alert나 뭐로 이미 지금 선택한 게시글엔 이 유저한테 신청받았다고 알려주자,
    //반대로 신청할 땐 신청하려는데 내가 이미 초대를 받았을 경우가 있음, 그럼 신청 눌렀을때 
})


//메인페이지에서의 조건 검색으로 inviteList를 이제 지우고 request 컬렉션에 insert하는 부분
app.get('/invitedetail', checklogin, function(req,res){
    db.collection('invite').findOne({id:req.user.id}, function(error, result){

        db.collection('request').findOne({신청자:result.초대받은사람 ,작성자:req.user.id ,신청한게시물번호: result.게시글번호}, function(error,result2){
            if(result2 != null){
                // console.log('중복된 경기가 있습니다.')
                console.log(result)
                db.collection('invite').updateOne({ id: req.user.id }, {//여기서 최종적으로 invite컬렉션엔 초대한사람id, 초대받은사람id, 선택한게시물번호가 업데이트 다 완료가 됨
                    $set:
                    {
                        게시글번호: null
                    }
                }, function (error, result) {    
                    db.collection('invite').findOne({id:req.user.id},function(error,result){
                        // console.log(result); 클릭한값들 다 제대로 들어감
            
                    })
                })
                // res.write("<script>alert('already apply, another choice')</script>");
                // res.write("<script>window.location=\"../boardview2\"</script>");

            }
            if(result2 == null){
                db.collection('board').findOne({_id:result.게시글번호}, function(error, result3) {
                    db.collection('request').insertOne({//이 부분을 request컬렉션에 박히도록 바꿔야함, 이미 invite컬렉션에 id, 초대한유저id, 게시글번호가 있으니
                        //그걸로 이미 매칭이 완료된 경기이면 insert못하도록(신청으로 매칭이 됬든 초대로 매칭이 됬든 같은 게시글에 매칭이 된거면 중복되게 하면 안됨) 이미 매칭된 경기라는 알림을 줘야함
                        //초대 했을때 값 -> 초대자 id, 초대받은 사람 id, 게시글 번호(조회할땐 신청한게시물번호)
                        //신청했을때 값 -> 신청자 id, 작성자 id, 신청한게시물번호
                        //request 컬렉션의 변수 이름을 초대했을경우엔 아래형식으로 박아도 되나? 아래 형식으로 박아도됨, 대신 박을때 평가여부: parseInt(0) 추가해서 박자
                        // 초대한사람: req.user.id,
                        // 초대받은사람: result.초대받은사람,
                        // 게시글번호: result2._id,
                        // 제목:result2.제목,
                        // 게시글:result2.게시글,
                        // 장소:result2.장소,
                        // 인원:result2.인원,
                        // 경기진행날짜:result2.경기진행날짜,
                        // 경기진행시간:result2.경기진행시간,
                        // count:result2.count,
                        // 여부:parseInt(0),
                        // 평가여부: parseInt(0)
                        신청한게시물번호: result3._id,
                        제목: result3.제목,
                        게시글: result3.게시글,
                        초대한사람: req.user.id,
                        초대받은사람: result.초대받은사람,
                        장소: result3.장소,
                        인원: result3.인원,
                        경기진행날짜: result3.경기진행날짜,
                        경기진행시간: result3.경기진행시간,
                        남은인원: result3.count,
                        여부: parseInt(0),
                        평가여부: parseInt(0)
                    })

                    db.collection('invite').updateOne({ id: req.user.id }, {//여기서 최종적으로 invite컬렉션엔 초대한사람id, 초대받은사람id, 선택한게시물번호가 업데이트 다 완료가 됨
                        $set:
                        {
                            게시글번호: null
                        }
                    }, function (error, result) {    
                        db.collection('invite').findOne({id:req.user.id},function(error,result){
                            // console.log(result); 클릭한값들 다 제대로 들어감
                
                        })
                    })
                    res.render('invitedetail.ejs',{board: result3, person: result, host: req.user.id });
                })
            }
        })

    })
})

app.get('/myinvitelist', function(req,res){
    db.collection('request').find({초대한사람: req.user.id}).toArray(function(error,result){//여기 request컬렉션으로 바꿈
        res.render('myinvitelist.ejs', {personlist: result});
    });
})

app.post('/cancelinvite',function(req,res){
    db.collection('request').findOne({초대받은사람:req.body.reciever, 게시글번호:req.body.articlenum},function(error,result){
        db.collection('request').deleteOne({초대한사람: req.body.sender});//여기조건은 취소가 되는지 안되는지 확인이 필요함
    })
    res.write("<script>window.location=\"../myinvitelist\"</script>");
})

app.get('/invited_match', function(req,res){
    db.collection('request').find({초대받은사람:req.user.id}).toArray(function(error,result){
        res.render('invited_match.ejs', {result:result});
    })
})

//초대 수락
app.put('/acc_invite', checklogin, function (req, res) {
    const count = parseInt(req.body.accept)
    console.log(count)
        db.collection('request').updateOne({ 초대받은사람:req.user.id , 신청한게시물번호:parseInt(req.body.accept) }, {
            $set:
            {
                여부: parseInt(1)
            }
        }, function(error,result) {
            db.collection('board').updateOne({ _id: count }, { $inc: { count: -1 } }, function (error, result) {
                console.log("성공")
                if (error) { return console.log(error) };
            })
        })
});

// app.put('/accept', checklogin, function (req, res) {
//     const id = new mongoose.Types.ObjectId(req.body._id.id);
//     const count = parseInt(req.body._id.articlenum) // 신청한게시물번호
//     console.log(req.body._id.articlenum)
//     console.log(req.body._id.id)

//     db.collection('request').updateOne({ _id: id }, {
//         $set: {
//             여부: parseInt(1)
//         }
//     }, function (error, result) {
//         db.collection('board').updateOne({ _id: count }, { $inc: { count: -1 } }, function (error, result) {
//             if (error) { return console.log(error) };
//         })
//     })
// });
//초대 거절
app.put('/ref_invite', checklogin, function (req, res) {
    console.log(typeof req.body.refuse); //string
        db.collection('request').updateOne({ 초대받은사람:req.user.id, 신청한게시물번호:parseInt(req.body.refuse) }, {
            $set:
            {
                여부: parseInt(2)
            }
        })
});

app.post('/before_ev', checklogin, function(req, res) {
    var id = req.body.id;
    var articlenum = req.body.articlenum;
    console.log(articlenum)//4잘뜸, 클릭한 게시글이 당시 4였음
    db.collection('work').updateOne({id: req.user.id},{
        $set: {
            other: id,
            게시글번호: articlenum
        }
    })
})

app.get('/score', function(req,res){

    db.collection('work').findOne({id: req.user.id},function(error,result1){
        db.collection('evaluate').findOne({평가받은사람:result1.other} ,function(error,result2){
            //console.log(result1.게시글번호)
            res.render('score.ejs', {result:result2, articlenum: result1});
        })
    })
})


//내가 원하는 조건의 팀원 자동추천 리스트 보기 페이지
// app.get('/autorecommand', checklogin, function(req, res){
//     db.collection('profile').findOne({id: req.user.id}, function(error,result){
//         db.collection('profile').find({선호포지션: result.팀원선호포지션, 주발: result.팀원주발, 성별: result.팀원성별}).toArray(function(error,result2){
//             db.collection('evaluate').find().toArray(function(error,result3){
//                 db.collection('board').find({작성자: req.user.id}).toArray(function(error,result4){
//                     res.render('autorecommand.ejs', {board: result4 ,score: result3 ,autolist: result2 , myprofile: result})
//                 })
//             })
//         })
//     })
// })
////////////////////////////////////////////////////////////
// app.get('/autoeditpage',function(req,res){
//     res.render('autoeditpage.ejs');
// })

// app.post('/autoeditpage',function(req,res){
//     db.collection('profile').updateOne({id:req.user.id}, {
//         $set:
//         {
//             팀원선호포지션: req.body.team_position,
//             팀원성별: req.body.team_identityGender,
//             팀원주발: req.body.team_foot
//         }
//     }, function(error,result){
//         res.write("<script>window.location=\"../autorecommand\"</script>");
//     })
   
// })


//초대에서의 inviteList컬렉션 insert부분,자동 초대 안할거임, 중복 오류 너무나서 지울부분
// app.post('/autoinvite',function(req,res){
//     var user = req.body.id//초대버튼 누른 유저 아이디값
//     db.collection('board').find({작성자:req.user.id}).toArray(function(error,result){
//         for(var i=0; i<result.length; i++){
//             if(result[i].count != 0){
//                 db.collection('inviteList').insertOne({
//                     초대한사람: req.user.id,
//                     초대받은사람: req.body.id,
//                     게시글번호: result[i]._id,
//                     제목:result[i].제목,
//                     게시글:result[i].게시글,
//                     장소:result[i].장소,
//                     인원:result[i].인원,
//                     경기진행날짜:result[i].경기진행날짜,
//                     경기진행시간:result[i].경기진행시간,
//                     count:result[i].count,
//                     여부:parseInt(0),
//                     평가여부:parseInt(0)
//                 })
//             }
//         }
//     })
// })


//////////////// 여기서부터 매치등록 중복 등록 방지 코드 ///////////////////////
var today = new Date();

var year = today.getFullYear();
var month = ('0' + (today.getMonth() + 1)).slice(-2);
var day = ('0' + today.getDate()).slice(-2);

var dateString = year + '-' + month  + '-' + day;
var dateKor = month  + '월' + day + '일';

app.get('/selDate', function(req,res){
     // 현재날짜
    // console.log(dateString);
    var place = "소운동장";
    // console.log(typeof place); //String
    db.collection('board').find({장소:place, 경기진행날짜:dateString}).toArray(function(error,result){
        res.render('selDate.ejs', {date:dateString, dateKor:dateKor,place:place, result:result});
        // console.log(result);
    }) 
})

app.post('/selplace', function(req,res) {
    console.log(req.body.place);
    var date = dateString // 현재날짜
        db.collection('addmatch').updateOne({id:req.user.id}, {
            $set: 
            {
                place:req.body.place
            }
        }, function(error, result){
            console.log("place updated")
        })
    if(req.body.place == "소운동장") {
        res.write("<script>window.location=\"../small_playground\"</script>");
    }
    else if( req.body.place == "대운동장 풋살장(체육관 옆)") {
        res.write("<script>window.location=\"../gym\"</script>");
    } else if ( req.body.place == "대운동장 풋살장(농구골대 옆)") {
        res.write("<script>window.location=\"../basket\"</script>");
    }
})

app.get('/small_playground', function(req,res){
    var date = dateString
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:date}).toArray(function(error, result2){
            res.render('small_playground.ejs', {result: result, date:date, result2:result2})
        })
    })
})
app.get('/gym', function(req,res){
    var date = dateString
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:date}).toArray(function(error, result2) {
            res.render('gym.ejs', {result: result, date:date, result2:result2})
        })
    })
})
app.get('/basket', function(req,res){
    var date = dateString
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:date}).toArray(function(error,result2){
            res.render('basket.ejs', {result: result, date:date, result2:result2})
        })
    })
})

app.post('/calendar2', checklogin, function (req, res) {
    var day = req.body.date;
    console.log(day); //달력 클릭으로 넘어온 날짜
    db.collection('addmatch').updateOne({id:req.user.id}, {
        $set:
        {
            date: day
        }
    }, function(error, result) {
        console.log("1 document updated");
    })
    res.write("<script>window.location=\"../matchlist\"</script>");
})

app.get('/matchlist', checklogin, function(req, res){
    var place = "소운동장";
    db.collection('addmatch').findOne({id:req.user.id} ,function(error, result) {
        // console.log(result);
        db.collection('board').find({장소:place, 경기진행날짜:result.date}).toArray(function(error,result2){
            res.render('matchlist.ejs', {result2:result2, date:result.date, place:place});
            // console.log(result2);
        })
    }) 
})

app.post('/matchlist', checklogin, function(req,res){
    var place = req.body.place;
    // console.log(place);
    
    db.collection('addmatch').updateOne({id:req.user.id},{
        $set:
        {
            place : place
        }
    })
    // db.collection('addmatch').deleteOne({id:req.user.id} ,function(error,result){
    //     console.log("delete success")
    // });
});

app.post('/selplace2', function(req,res) {
    console.log(req.body.place);
        db.collection('addmatch').updateOne({id:req.user.id}, {
            $set: 
            {
                place:req.body.place
            }
        }, function(error, result){
            console.log("place updated")
        })
    if(req.body.place == "소운동장") {
        res.write("<script>window.location=\"../small_playground2\"</script>");
    }
    else if( req.body.place == "대운동장 풋살장(체육관 옆)") {
        res.write("<script>window.location=\"../gym2\"</script>");
    } else if ( req.body.place == "대운동장 풋살장(농구골대 옆)") {
        res.write("<script>window.location=\"../basket2\"</script>");
    }
})

app.get('/small_playground2', function(req,res){
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:result.date}).toArray(function(error, result2){
            res.render('small_playground2.ejs', {result: result, date:result.date, result2:result2})
        })
    })
})
app.get('/gym2', function(req,res){
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:result.date}).toArray(function(error, result2){
            res.render('gym2.ejs', {result: result, date:result.date, result2:result2})
        })
    })
})
app.get('/basket2', function(req,res){
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:result.date}).toArray(function(error, result2){
            console.log(result2);
            res.render('basket2.ejs', {result: result, date:result.date, result2:result2})
        })
    })
})


////////////////////////////////////매치등록 중복 방지 코드 end /////////////////////////////////////////////////

////////////////////////////////////메인페이지 매치 신청 코드 start ///////////////////////////////////////////////
app.post('/main_selplace', function(req,res) {
    console.log(req.body.place);
    var date = dateString // 현재날짜
        db.collection('addmatch').updateOne({id:req.user.id}, {
            $set: 
            {
                place:req.body.place
            }
        }, function(error, result){
            console.log("place updated")
        })
    if(req.body.place == "소운동장") {
        res.write("<script>window.location=\"../main_small_playground\"</script>");
    }
    else if( req.body.place == "대운동장 풋살장(체육관 옆)") {
        res.write("<script>window.location=\"../main_gym\"</script>");
    } else if ( req.body.place == "대운동장 풋살장(농구골대 옆)") {
        res.write("<script>window.location=\"../main_basket\"</script>");
    }
})

app.get('/main_small_playground', function(req,res){
    var date = dateString;
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:date}).toArray(function(error, result2){
            res.render('main_small_playground.ejs', {date:date, dateKor:dateKor, result2:result2})
            console.log(dateKor);
        })
    })
})

app.get('/main_gym', function(req,res){
    var date = dateString
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:date}).toArray(function(error, result2) {
            res.render('main_gym.ejs', {date:date, dateKor:dateKor,result2:result2})
        })
    })
})

app.get('/main_basket', function(req,res){
    var date = dateString
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:date}).toArray(function(error,result2){
            res.render('main_basket.ejs', {date:date, dateKor:dateKor, result2:result2})
        })
    })
})

//달력
app.post('/calendar', function (req, res) {
    db.collection('searchdate').deleteMany({}, function (error, result) {
    });
    var day = req.body.date;

    console.log(day); //달력 클릭으로 넘어온 날짜list

    db.collection('addmatch').updateOne({id:req.user.id}, {
        $set:
        {
            date: day
        }
    }, function(error, result) {
        console.log("1 document updated");
    })
    
    db.collection('board').find({ 경기진행날짜: req.body.date }).toArray(function (error, result) {
        for (var i = 0; i < result.length; i++) {
            db.collection('searchdate').insertOne({
                id: req.user.id,
                경기진행날짜: req.body.date,
                경기진행시간: result[i].경기진행시간,
                art_id: result[i]._id,
                작성자: result[i].작성자,
                제목: result[i].제목,
                게시글: result[i].게시글,
                장소: result[i].장소,
                인원: result[i].인원,
                남은인원: result[i].count
            })
        }
    })
    res.write("<script>window.location=\"../list\"</script>");
})

app.get('/list', function (req, res) {
    var place = "소운동장";
    //searchdate에 클릭한 날짜에 해당하는 게시글이 이미 있음
    db.collection('searchdate').find({id: req.user.id, 장소:place}).toArray(function(error, result){
        res.render('list.ejs', {result: result, place:place})
    })
})

app.post('/main_selplace2', function(req,res) {
    console.log(req.body.place);
    var date = dateString // 현재날짜
        db.collection('addmatch').updateOne({id:req.user.id}, {
            $set: 
            {
                place:req.body.place
            }
        }, function(error, result){
            console.log("place updated")
        })
    if(req.body.place == "소운동장") {
        res.write("<script>window.location=\"../main_small_playground2\"</script>");
    }
    else if( req.body.place == "대운동장 풋살장(체육관 옆)") {
        res.write("<script>window.location=\"../main_gym2\"</script>");
    } else if ( req.body.place == "대운동장 풋살장(농구골대 옆)") {
        res.write("<script>window.location=\"../main_basket2\"</script>");
    }
})

app.get('/main_small_playground2', function(req,res){
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:result.date}).toArray(function(error, result2){
            res.render('main_small_playground2.ejs', {result2:result2, date:result.date})
        })
    })
})

app.get('/main_gym2', function(req,res){
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:result.date}).toArray(function(error, result2) {
            res.render('main_gym2.ejs', {result2:result2, date:result.date})
        })
    })
})

app.get('/main_basket2', function(req,res){
    db.collection('addmatch').findOne({id:req.user.id}, function(error,result){
        db.collection('board').find({장소:result.place, 경기진행날짜:result.date}).toArray(function(error,result2){
            res.render('main_basket2.ejs', {result2:result2, date:result.date})
        })
    })
})
////////////////////////////////////메인페이지 매치 신청 코드 end ///////////////////////////////////////////////

//dateString이 위에서 현재날짜를 담은 변수임
app.get('/evaluate',function(req,res){
    db.collection('request').find().toArray(function(error,result){
        db.collection('request').deleteMany({평가여부: 1});
    })
    //신청한사람,신청자: req.user.id
    // db.collection('request').find({신청자: req.user.id, 여부: 1}).toArray(function(error,result){//result에 신청자가 로그인유저고 여부1인 값들이 담겨옴
    //     //console.log(result)//값 제대로 출력됨

    //     //신청받은사람, 작성자: req.user.id
    //     db.collection('request').find({작성자: req.user.id, 여부: 1}).toArray(function(error,result2){//result2에 작성자가 로그인유저고 여부1인 값들이 담겨옴
    //         //console.log(result2)//값 제대로 출력됨

    //         //초대한사람
    //         db.collection('inviteList').find({초대한사람: req.user.id, 여부: 1}).toArray(function(error,result3){//result3에 초대한사람이 로그인유저고 여부1인 값들이 담겨옴
    //             //console.log(result3)//값 제대로 출력됨

    //             //초대받은사람
    //             db.collection('inviteList').find({초대받은사람: req.user.id, 여부: 1}).toArray(function(error,result4){//result3에 초대한사람이 로그인유저고 여부1인 값들이 담겨옴
    //                 //console.log(result4)//값 제대로 출력됨
    //                 // console.log(dateString > result4[0].경기진행날짜)//11월10일 11월 15일 비교, false가 뜨면 맞음
    //                 // console.log(dateString > result4[1].경기진행날짜)//11월10일 11월 09일 비교, true가 뜨면 맞음
    //                 res.render('evaluate.ejs', {user: req.user.id, date: dateString, apply_sender: result, apply_receiver: result2, invite_sender: result3, invite_receiver: result4})
    //             })
    //         })

    //     })

    // })
    db.collection('request').find({신청자: req.user.id, 여부:1}).toArray(function(error,result){
                db.collection('request').find({초대받은사람: req.user.id, 여부: 1}).toArray(function(error,result2){
                    res.render('evaluate.ejs', {user: req.user.id, date: dateString, apply_sender: result, invite_receiver: result2})
                })
    })
})