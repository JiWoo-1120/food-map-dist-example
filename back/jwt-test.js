const jwt = require("jsonwebtoken"); // jsonwebtoken 이라는 라이브러리 가져오기

const secret = "this is my secret";

const token = jwt.sign(
        { userIdx: 100, nickname : "김철수" }, // payload 정의
        secret // 서버 비밀키
      );

console.log(token);

const verifiedToken = jwt.verify(token, secret); // verify : 검증 메서드

console.log(verifiedToken);