var express = require('express');
var router = express.Router();

//npm i mongodb --save
const db = require('mongodb').MongoClient;
// mongodb://아이디:암호@서버주소:포트번호/DB명
const dbUrl = 'mongodb://id215:pw215@1.234.5.158:37017/db215';

//get(조회), post(추가), put(수정), delete(삭제)


//글쓰기 : localhost:3000/board/insert
// req : request :  들어오는 값의 정보
// res : response : 전달하는 값
router.post('/insert', async function(req, res, next) {
    try{
        console.log("-------------------------")
        console.log(req.body);
        //{ no: 100, title: '제목', writer: '홍길동', content: 'aaa' }

        console.log("-------------------------")

        // DataBase(DB)에 전달된 자료를 1개 추가함.
        // 1. DB접속
        const dbConn = await db.connect(dbUrl);
        // 2. 테이블 == 컬렉션
        const coll = dbConn.db("db215").collection("board");
        const result = await coll.insertOne(req.body);
        console.log(result);

        const obj = {status:200}
        res.send(obj);
    }
    catch(err){
        console.error(err);
        res.send({status:888});
    }
});

module.exports = router;

