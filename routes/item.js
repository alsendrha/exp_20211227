var express = require('express');
var router = express.Router();

const db = require('mongodb').MongoClient;
// mongodb://아이디:암호@서버주소:포트번호/DB명
const DBURL = require('../config/db').mongodbURL;
const DBNAME = require('../config/db').mongodbDB;


//npm i multer --save
const multer = require('multer');

// 특정폴더에 파일을 보관 or 메모리(DB에 저장)
const upload = multer({storage:multer.memoryStorage()});



// 물품등록 : http://localhost:3000/item/insert
// 이미지1, 물품코드(x) 물품명, 물품내용, 물품가격, 재고수량, 등록일(x)
router.post('/insert', upload.single("file"), async function(req, res, next) {
     try{
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("sequence");
        const result = await coll.findOneAndUpdate(
            {_id:'SEQ_ITEM_NO'}, {$inc : {seq : 1}}
        );

        const obj = {
            _id : result.value.seq, // 물품번호(자동부여)
            name : req.body.name, // 물품명, 물품내용, 가격, 수량
            content : req.body.content,
            price : req.body.price,
            quantity : req.body.quantity,
            filename : req.file.originalname,
            filetype : req.file.mimetype,
            filedata : req.file.buffer,
            filesize : req.file.size,
            regdate : new Date()
        };

        const coll1 = dbConn.db(DBNAME).collection('item');
        const result1 = await coll1.insertOne(obj);  
        //console.log(result1);
        if( result1.insertedId > 0 ){
            return res.send({status:200});
        }
        return res.send({status:0});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 이미지(1개밖에 안됨) : http://localhost:3000/item/image?no=2
router.get('/image', async function(req, res, next){
    try{
        const no = Number(req.query.no);
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("item");

        const result = await coll.findOne(
            {_id : no}, // 조건
            {projection : {filedata:1, filetype:1} } // 필요한것만
        );

        console.log(result);
        res.contentType(result.filetype);//json -> image/jpeg
        return res.send(result.filedata.buffer);
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 물품등록 : http://localhost:3000/item/select?page=1
router.get('/select', async function(req, res, next){
    try {
        // 페이지 정보가 전달
        const page = Number(req.query.page);
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("item");

        // 물품코드, 물품명, 가격, 수량
        const result = await coll.find(
            { },//조건
             {projection:{_id:1 , name:1, price : 1, quantity :1, regdate :1}
            })
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

module.exports = router;
