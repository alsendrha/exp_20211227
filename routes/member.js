var express = require('express');
var router = express.Router();

const db = require('mongodb').MongoClient;
const DBURL = require('../config/db').mongodbURL;
const DBNAME = require('../config/db').mongodbDB;

//npm i jsonwebtoken --save
const jwt = require('jsonwebtoken');
const jwtkey = require('../config/auth').securitykey;
const jwtOptions  = require('../config/auth').options;
const checkToken = require('../config/auth').checkToken;



//회원가입, 로그인시 암호 hash용
const crypto = require('crypto');

//회원정보전달 : http://localhost:3000/member/selectone
router.get('/selectone', checkToken, async function(req, res, nest){
    try{
        //아이디 req.body.userid(auth.js에 수동으로 전달!!)
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("member");

        const result = await coll.findOne(
            {_id : req.body.userid},
            {projection : {userpw : 0, _id : 0}}
        );
        return res.send({status:200, result:result});

    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});


//회원정보수정 : http://localhost:3000/member/mypage?menu=1
//비밀번호변경 : http://localhost:3000/member/mypage?menu=2
//회원탈퇴 : http://localhost:3000/member/mypage?menu=3
router.put('/mypage', checkToken, async function(req, res, nest){
    try{
        console.log(req.query.menu); // 결과정보
        console.log(typeof req.query.menu); //타입정보

        const menu = Number(req.query.menu);

        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("member");

        if(menu===1) {
            const result = await coll.updateOne(
                {_id : req.body.userid}, // 조건
                {$set : { 
                        userage : req.body.userage, 
                        useremail:req.body.useremail
                        } 
                }, // 변경내용
            );

            console.log(result);
            if((await result).modifiedCount===1){
                return res.send({status:200});
            }
            return res.send({status:0});
        }
        else if(menu===2){
            // req.body.userid 아이디(변경x)
            // req.body.userpw 현재암호
            // req.body.userpw1 바꿀암호

         
            const hash = crypto.createHmac('sha256', req.body.userid)
            .update(req.body.userpw).digest('hex');

            const hash1 = crypto.createHmac('sha256', req.body.userid)
            .update(req.body.userpw1).digest('hex');

            const result = await coll.updateOne(
                {_id : req.body.userid, userpw : hash}, // 조건 아이디와 암호가 일치하는 조건

                {$set :{userpw : hash1 }}, // 변경할 내용 바꿀암호
            );

            console.log(result);
            if(result.modifiedCount===1){
                return res.send({status:200});
            }
            return res.send({status:0});
        }
        else if(menu===3){
            const hash = crypto.createHmac('sha256', req.body.userid)
                .update(req.body.userpw).digest('hex');
            
            const result = await coll.deleteOne(
                {_id : req.body.userid, userpw : hash} // 삭제 조건 : 아이디, 암호 일치할경우
            );
            console.log(result);
            //삭제보다는 필요시에 중요정보를 updateOne.
            if(result.deletedCount===1){
                return res.send({status:200});
            }
            return res.send({status:0});

        }
        return res.send({status:-1, result:"메뉴정보없음"});


    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 로그인 : http://localhost:3000/member/select
router.post('/select', async function(req, res, next){
    try{
        //회원가입시 사용해던 암호화 방식으로 hash해야
        //DB에서 로그인 비교가 가능함.
        const hash = crypto.createHmac('sha256', req.body.uid)
            .update(req.body.upw).digest('hex');

        const obj = {
            userid : req.body.uid,
            userpw : hash
        };

        console.log(obj);

        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("member");

        // const query = {$and : [{_id : obj.userid}, {userpw : obj.userpw}]};
        const query = {_id : obj.userid, userpw : obj.userpw};
        const result = await coll.findOne(query);

        console.log(result); // 일치할경우, 일치하지않을경우
        if(result !==null){
            const token = { // 토큰만드는 문법
                token : jwt.sign(
                    {uid : result._id}, // 토큰에 포함할 내용들..
                    jwtkey,             // 토큰생성 키
                    jwtOptions           // 옵션
                    ),
                refreshToken : null,        //null
            }
            return res.send({status:200, result: token});
        }
        return res.send({status:0});
    }
    
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 회원가입 : http://localhost:3000/member/insert
router.post('/insert', async function(req, res, next) {
    try{
    
    console.log(req.body);

    
   
    // hash(salt)는 abc -> fsfasdfsadfsafasdfsdfa
    req.body.upw
    const hash = crypto.createHmac('sha256', req.body.uid)
                        .update(req.body.upw).digest('hex');
    const obj = {
        _id : req.body.uid,
        userpw : hash,
        userage : Number(req.body.uage),
        userbirth : req.body.ubirth,
        useremail : req.body.uemail,
        usercheck : req.body.ucheck,
        usergender : Number(req.body.ugender)
    };
    console.log(obj);
    const dbConn = await db.connect(DBURL);
    const coll = dbConn.db(DBNAME).collection("member");

    const result = await coll.insertOne(obj);
    console.log(result); //성공 or 실패
    if(result.insertedId ===obj._id){
        return res.send({status:200});
    }
    return res.send({status:0});

    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

//아이디중복확인 : http://localhost:3000/member/idcheck
router.get('/idcheck', async function(req, res, next) {
    try{
        const userid = req.query.uid;
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("member");

        const query = { _id : userid };
        const result = await coll.countDocuments(query);

        console.log(result);
        return res.send({status:200, result:result});

    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 회원목록 : http://localhost:3000/member/select
router.get('/select', async function(req, res, next){
    try {
        const page = Number(req.query.page);
        const text = req.query.text;

        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("member");

        const query = { _id : new RegExp(text, 'i') };

        const result = await coll.find(query)
                                .sort({_id : -1})   // 1 오름차순, -1 내림차순
                                .skip((page-1)*10)            // 생략할 개수
                                .limit(10)          //10개 까지만
                                .toArray();
        console.log(result);
        const total = await coll. countDocuments(query);
        return res.send({status:200, result:result, total:total});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});







module.exports = router;
