var express = require('express');
var router = express.Router();

//npm i mongodb --save
const db = require('mongodb').MongoClient;
// mongodb://아이디:암호@서버주소:포트번호/DB명
const dbUrl = 'mongodb://id215:pw215@1.234.5.158:37017/db215';

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

        const coll = dbConn.db("db215").collection("seqboard");
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
        return send({status:-1});

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

// 게시물 목록 : http://localhost:3000/board/select
router.get('/select', async function(req, res, next){
    try {
        // 페이지 정보가 전달
        const page = Number(req.query.page);
        // 1-> skip(0) -> skip(  ( page-1 )*10   )
        // 2-> skip(10)
        // 3-> skip(20)

        const dbConn = await db.connect(dbUrl);
        const coll = dbConn.db("db215").collection("board");

        // 여러개 가져오기 find()...... toArray()변환
        const result = await coll.find({  })
                                .sort({_id : -1})   // 1 오름차순, -1 내림차순
                                .skip((page-1)*10)            // 생략할 개수
                                .limit(10)          //10개 까지만
                                .toArray();
        console.log(result);
        //페이지네이션에서 사용할 전체 개시물 수
        const total = await coll. countDocuments({});

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
router.delete('/delete', async function(req, res, next){
    try{
        
        const no = Number(req.query.no);
        const dbConn = await db.connect(dbUrl);
        const coll = dbConn.db("db215").collection("board");

        const result = await coll.deleteOne(
            {_id : no},
        );
        console.log(result);
        return res.send({status:200});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }

});

//게시물 수정 : http://localhost:3000/board/update
router.put('/update', async function(req, res, next){
    try{
        //제목, 내용만 수정가능 + 조건으로 사용할 글번호
        const no = Number(req.query.no); 
        const title = req.body.title;
        const content = req.body.const;
        const dbConn = await db.connect(dbUrl);
        const coll = dbConn.db("db215").collection("board");
        
        const result = await coll.updateOne(
            {_id : no},
            {_$set : {title:title, content:content}},
        );
        console.log(result);
        if(result.modifiedCount === 1){
            return res.send({status:200, result:result});
        }
        return res.send({status:-1});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }

});

//이전글

//다음글


module.exports = router;

