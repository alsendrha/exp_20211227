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

// 물품1개조회(이미지포함) : http://localhost:3000/item/selectone?code=10018
router.get('/selectone', async function(req, res, next){
    try {
        const code = Number(req.query.code);
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("item");

        const result = await coll.findOne(
            {_id : code}, // 조건
            {projection : {filename:0, filedata:0, filesize:0, filetype:0}}  // 필요한 항목만
        );
        console.log(result); //확인
        // '/item/image?no=10018

        //이미지 데이터를 전달하는게 아님, 
        //이미지를 볼수있는 url을 전달
        result['image'] ='/item/image?no=' + code + '$dt=' + new Date().getTime();
        return res.send({status:200, result:result});

    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }

});

//물품삭제 : http://localhost:3000/item/delete?code=10018
router.delete('/delete', async function(req, res, next){
    try{
        const code = Number(req.query.code);
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("item");

        const result = await coll.deleteOne(
            {_id : code},
        );
        console.log(result);// 삭제가 되던 안되던 성공
        if(result.deletedCount === 1){
            return res.send({status:200});
        }
        return res.send({status:0});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});


//물품수정 : http://localhost:3000/item/update?code=10018
// qurey + body
router.put('/update', upload.single("file"), async function(req, res, next){
    try{
        const code = Number(req.query.code);

        //물품명, 물품내용, 물품가격, 재고수량, 이미지

        // const 상수 처음만든 값에 +,- 안됨.
        // let, var 변수 처음만든값에 +,-가능.
        let obj = { // 이미지를 첨부하지 않을 경우 변경할 항목
            name     : req.body.name,
            content  : req.body.content,
            price    : req.body.price,
            quantity : req.body. quantity
            
        };

        if(typeof req.file !== 'undefined'){
            obj['filename'] = req.file.originalname;//파일명
            obj.filetype    = req.file.mimetype;
            obj.filedata    = req.file.buffer;
            obj.filesize    = req.file.size;

        }

        // const obj = { // 이미지가 첨부되었을떄 변경할 항목
        //     name : req.body.name,
        //     content : req.body.content,
        //     price : req.body.price,
        //     quantity : req.body. quantity
        // }
        
        console.log(code);
        console.log(obj);

        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("item");
        const result = await coll.updateOne(
            {_id : code}, //조건
            {$set : obj},//실제 변경할내용
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

// 물품일괄등록 : http://localhost:3000/item/insertbatch
router.post('/insertbatch', upload.array("file"), async function(req, res, next){
    try{
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("sequence");

        const count = req.body.name.length;

        //const aaa = ['aaa', 'bbb', 'ccc']; 
        //aaa.length => 3
        //console.log(aaa[0])
        
        let arr=[]; // [{},{},{},{}]
        for(let i=0; i< count; i++){
            const result = await coll.findOneAndUpdate(
                {_id:'SEQ_ITEM_NO'}, {$inc : {seq : 1}}
            );
            const obj ={
                _id : result.value.seq,
                name : req.body.name[i],
                content : req.body.content[i],
                price : req.body.price[i],
                quantity : req.body.quantity[i],
                filename : req.files[i].originalname,
                filedata : req.files[i].buffer,
                filetype : req.files[i].mimetype,
                filesize : req.files[i].size,
                regdate : new Date()
            };

            arr.push(obj);
        }

        const coll1 = dbConn.db(DBNAME).collection("item");
        const result1 = await coll1.insertMany(arr);//[{},{}]
        console.log(result1);

        if(result1.insertedCount===count){
            return res.send({status : 200});
        }
        return res.send({status:0});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 물품일괄삭제 : http://localhost:3000/item/deletebatch
router.delete('/deletebatch', async function(req, res, next){
    try{

        //req.body =>{code : [10115, 10114, 10113]}
        //             req.body.code[0], req.bodt.code[1]
        //[ { code: 10115 }, { code: 10114 }, { code: 10113 } ]
        //   req.body[0].code           
        console.log(req.body);
        let arr = [];
        for(let i=0; i< req.body.length; i++){ // 0,1,2..
            arr.push(req.body[i].code);
        }
        
        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("item");

        const result = await coll.deleteMany({
            _id : {$in : arr}
        });
        console.log(result);

        if(result.deletedCount ==req.body.length){
            return res.send({status:200});
        }
        return res.send({status:0});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});

// 물품일괄수정 : http://localhost:3000/item/updatebatch
router.put('/updatebatch', upload.array("file"), async function(req, res, next){
    try{
        const count = req.body.name.length;

        const dbConn = await db.connect(DBURL);
        const coll = dbConn.db(DBNAME).collection("item");

        let cnt = 0; //변경한 라인의 숫자

        for(let i=0; i<count; i++){

            let obj = {
                name : req.body.name[i],
                content : req.body.content[i],
                price : req.body.price[i],
                quantity : req.body.quantity[i]

            };

            //req.files ==> [{},{}]
            if(typeof req.files[i] !== 'undefined'){
                obj['filename'] = req.files[i].originalname,
                obj['filedata'] = req.files[i].buffer,
                obj['filetype'] = req.files[i].mimetype,
                obj.filesize = req.files[i].size
            }

            const result = await coll.updateOne( // 0 1 2
                {_id : Number(req.body.code[i])  }, //조건
                {$set : obj}
            );
            console.log(result); 

            cnt += result.modifiedCount; // cnt에 누적하기
        }
        if(cnt === count){
            return res.send({status:200});
        }
        return res.send({status:0});
    }
    catch(err){
        console.error(err);
        return res.send({status:-1, result : err});
    }
});
module.exports = router;
