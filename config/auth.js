// 파일명 : config/auth.js

// 토큰생성, 추출, 검증에 필요함
const e = require('express');
const jwt = require('jsonwebtoken');

var self = module.exports = {
    securitykey : 'fdgdfgdfgdfg4343342r3#@$@#TSfgre',
    options : {
        algorithm : 'HS256', //토큰 생성 hash알고리즘
        expiresIn : '9h', //토큰만료시간 ex) 9시간
        issuer : 'corp001', //토큰 발행자
    },

    //토큰이 전달되면 토큰의 유효성을 검증함.
    checkToken : async(req, res, next) => {
        try{
            const token = req.headers.token;
            // 토큰은 headers로 첨부해서 보냄
            // 1. 토큰이 있느냐?
            if(!token){
                return res.send({status:888, result:'토큰이 없음.'});
            }

            // 2. 토큰 decode 추출(토큰과 암호키)
            const user = jwt.verify(token, self.securitykey);

            if(typeof user.uid==='undefined'){
                return res.send({status:-1, result:'유효하지 않는 토큰'});
            }

            console.log('토큰에서 추출한 아이디=>',user.uid);

            // 수동으로 body에 포함(아이디, 이메일, 나이)
            req.body.userid = user.uid;

            //위쪽에서 토큰에 대한 유효성을 모두 pass할경우 다음으로 넘김
            //member.js 파일의 /mypage로 전달 불가!! (next가 없으면)
            next();

        }
        catch(err){
            console.error(err);
            if(err.massage==='invalid signature'){
                return res.send({status:-1, result : "인증실패"});

            }
            else if(err.massage==='jwt expired'){
                return res.send({status:-1, result : "시간만료"});
            }
            else if(err.massage==='invalid token'){
                return res.send({status:-1, result : "유효하지 않는 토큰입니다."});
                
            }
            return res.send({status:-1, result : err});
        }



    }
}

