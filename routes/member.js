var express = require('express');
var router = express.Router();

const db = require('mongodb').MongoClient;
const DBURL = require('../config/db').mongodbURL;
const DBNAME = require('../config/db').mongodbDB;

//npm i jsonwebtoken --save
const jwt = require('jsonwebtoken');
const jwtkey = require('../config/auth').securitykey;
const jwtOptions  = require('../config/auth').options;



//회원가입, 로그인시 암호 hash용
const crypto = require('crypto');

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







module.exports = router;
