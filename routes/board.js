var express = require('express');
var router = express.Router();

//npm i mongodb --save
const db = require('mongodb').MongoClient;
// mongodb://아이디:암호@서버주소:포트번호/DB명
const dbUrl = require('../config/db').mongodbURL;

//get(조회), post(추가), put(수정), delete(삭제)


//글쓰기 : localhost:3000/board/insert
// req : request :  들어오는 값의 정보 => post -> req.body
// res : response : 전달하는 값
router.post('/insert', async function(req, res, next) {
    try{
        console.log("-------------------------")
        console.log(req.body);
        //{title: '제목', writer: '홍길동', content: 'aaa' }

        console.log("-------------------------")
        // 접속 -> DB선택 -> 컬렉션 선택 -> CRUD(추가, 수정, 삭제, 조회)
        // 1회만
        const dbConn = await db.connect(dbUrl);

        const coll = dbConn.db("db215").collection("sequence");
        // 글번호 자동으로 {가져오기}, {수정하기}
        // _id 가 SEQ_BOARD_NO인것을 가지고 오고,
        // seq값을 기존값에 1증가시킴
        const result = await coll.findOneAndUpdate(
            {_id:'SEQ_BOARD_NO'},{$inc : {seq : 1}}
            );
        //글번호
        console.log(result.value.seq);

        const coll1 = dbConn.db("db215").collection("board");
        const result1 = await coll1.insertOne({
            _id : Number(result.value.seq), // 글번호
            title : req.body.title, // 전송되는 항목 글제목
            content : req.body.content, // 전송되는항목 글내용
            writer : req.body.writer, // 전송되는항목 작성자
            hit   : 1,              // 조회수
            regdata : new Date() // 현재시간
        });

        console.log(result1);
        if(result1.insertedId > 0){
            return res.send({status:200});
        }
        return res.send({status:-1});

    }
    catch(err){
        console.error(err);
        res.send({status:-1});
    }

});


// 게시물 상세내용 : http://localhost:3000/board/selectone
// req 전송되는 값 : GET -> req.query
router.get('/selectone', async function(req, res, next){
    try{
        const no = Number(req.query.no); //글번호
        console.log(no);
        //DB접속 -> DB선택 -> 컥렉션 선택 -> 1개 가져오기
        const dbConn = await db.connect(dbUrl);
        const coll = dbConn.db("db215").collection("board");
        const result = await coll.findOne(
            {_id : no}
        );
        console.log(result);

        return res.send({status:200, result:result});
    }

    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 게시물 목록 : http://localhost:3000/board/select?page=1&text=검색어
router.get('/select', async function(req, res, next){
    try {
        // 페이지 정보가 전달
        const page = Number(req.query.page);
        const text = req.query.text;
        // 1-> skip(0) -> skip(  ( page-1 )*10   )
        // 2-> skip(10)
        // 3-> skip(20)

        const dbConn = await db.connect(dbUrl);
        const coll = dbConn.db("db215").collection("board");

        // 여러개 가져오기 find()...... toArray()변환
        // 정규표현식 => new RegExp(검색단어, ignore 대소문자무시) 대소문자 구분하려면 i 빼기
        // 이메일 정확, 전화번호 정확
        const query = { title : new RegExp(text, 'i') };
        const result = await coll.find(query)
                                .sort({_id : -1})   // 1 오름차순, -1 내림차순
                                .skip((page-1)*10)            // 생략할 개수
                                .limit(10)          //10개 까지만
                                .toArray();
        console.log(result);
        //페이지네이션에서 사용할 전체 개시물 수
        const total = await coll. countDocuments(query);

        return res.send({status:200, result:result, total:total});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});


//조회수 증가 : http://localhost:3000/board/updatehit
router.put('/updatehit', async function(req, res, next){
    try{
        const no = Number(req.query.no); 
        const dbConn = await db.connect(dbUrl);
        const coll = dbConn.db("db215").collection("board");
        
        // 변경하기 updateOne({조건}, {변경할내용})
        const result = await coll.updateOne(
            {_id : no},  // 조건
            {$inc : {hit:1}} // 실제변경될 내용
        );
        console.log(result);
        if(result.modifiedCount === 1){
            return res.send({status:200});
        }
        return res.send({status:-1});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

//게시물 삭제 : http://localhost:3000/board/delete
// paramter은 글번호 no
router.delete('/delete', async function(req, res, next){
    try{
        //문자를 숫자로 number( 바꿀문자 )
        //숫자를 문자로 string( 바꿀숫자 )
        const no = Number(req.query.no);
        //바로 처리안되는 경우 await 사용 사용시 (async)
        const dbConn = await db.connect(dbUrl);
        const collection = dbConn.db("db215").collection("board");
        const result = await collection.deleteOne(
            {_id : no},
        );
        console.log(result);// 삭제가 되던 안되던 성공
        if(result.deletedCount === 1){
            return res.send({status:200});
        }
        return res.send({status:0});
    }
    //소스코드 오타, BD접속X(꺼짐등)등 물리적 오류 발생시
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err}); //시스템 오류
    }

});

//게시물 수정 : http://localhost:3000/board/update
router.put('/update', async function(req, res, next){
    try{
        //제목, 내용만 수정가능 + 조건으로 사용할 글번호
        const no = Number(req.body.no); 
        const title = req.body.title;
        const content = req.body.content;
        const dbConn = await db.connect(dbUrl);
        const collection = dbConn.db("db215").collection("board");
        const result = await collection.updateOne(
            {_id : no}, //조건
            {$set : {title:title, content:content}},//실제 변경할내용
        );
        console.log(result);
        if(result.modifiedCount === 1){
        return res.send({status:200});
        }
        return res.send({status:0});

    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }

});

//이전글 : http://localhost:3000/board/prevno
router.get('/prevno', async function(req, res, next){
    try{
        const no = Number(req.query.cno);
        const dbConn = await db.connect(dbUrl);
        const collection = dbConn.db("db215").collection("board");
        //미만 {$lt : }     직다 
        //이하 {$lte : }    작거나 같다
        //초과 {$gt :  }    크다
        //이상 {$gte : }    크거나 같다
        // $set  $and   $or
        const result = await collection.find(
            {_id : {$lt: no}}, //조건
            {projection : {_id : 1}} //필요한 항목만(_id만)
        ).sort({_id :-1}).limit(1).toArray();

        // result [ { _id: 78 } ] => result[0]._id
        //[{}], []
        console.log(result);
        if(result.length===1){
            return res.send({status:200, no:result[0]._id});
        }
        return res.send({status:200, no:0});
        
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});
//다음글 : http://localhost:3000/board/nextvno
router.get('/nextvno', async function(req, res, next){
    try{
        const no = Number(req.query.cno);
        const dbConn = await db.connect(dbUrl);
        const collection = dbConn.db("db215").collection("board");
        //미만 {$lt : }     직다 
        //이하 {$lte : }    작거나 같다
        //초과 {$gt :  }    크다
        //이상 {$gte : }    크거나 같다
        // $set  $and   $or
        const result = await collection.find(
            {_id : {$gt: no}}, //조건
            {projection : {_id : 1}} //필요한 항목만(_id만)
        ).sort({_id :1}).limit(1).toArray();

        // result [ { _id: 78 } ] => result[0]._id 배열안에 아이디만 빼기
        //[{}], []
        console.log(result);
        if(result.length===1){
            return res.send({status:200, no:result[0]._id});
        }
        return res.send({status:200, no:0});
        
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});


module.exports = router;

