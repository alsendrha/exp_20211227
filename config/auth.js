// 파일명 : config/auth.js
module.exports = {
    securitykey : 'fdgdfgdfgdfg4343342r3#@$@#TSfgre',
    options : {
        algorithm : 'HS256', //토큰 생성 hash알고리즘
        expiresIn : '9h', //토큰만료시간 ex) 9시간
        issuer : 'corp001', //토큰 발행자
    }
}

