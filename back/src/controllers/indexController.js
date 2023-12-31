const { pool } = require("../../config/database");
const { logger } = require("../../config/winston");
const jwt = require("jsonwebtoken");
const secret = require("../../config/secret");

const indexDao = require("../dao/indexDao");

// 식당 목록 조회
exports.readRestaurants = async function(req, res){
  
  console.log(`======================연결성공!======================`);

  const {category} = req.query;
  console.log(`======================${category}======================`);

  // 카테고리 값이 넘어 왔다면, 유효한 값인지 체크
  if(category){
    const validCategory = [
      "한식",
      "중식",
      "일식",
      "양식",
      "분식",
      "구이",
      "회/초밥",
      "기타", 
    ];
    if(!validCategory.includes(category)){
      return res.send({
        isSuccess: false,
        code: 410, // 요청 실패시 400번대 코드
        message: "카테고리가 적합하지 않습니다.",
      });
    }
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      const [rows] = await indexDao.selectreadRestaurants(connection, category);
      return res.send({
        result: rows,
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "요청 성공",
      });
    } catch (err) {
      logger.error(`readRestaurants Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`readRestaurants DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
}

// 회원가입
exports.createUsers = async function (req, res) {
  const { userID, password, nickname } = req.body;

  // 1. 유저 데이터 검증
  const userIDRegExp = /^[a-z]+[a-z0-9]{5,19}$/; // 아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20
  const passwordRegExp = /^(?=.*\d)(?=.*[a-zA-Z])[0-9a-zA-Z]{8,16}$/; // 비밀번호 정규식 8-16 문자, 숫자 조합
  const nicknameRegExp = /^[가-힣|a-z|A-Z|0-9|]{2,10}$/; // 닉네임 정규식 2-10 한글, 숫자 또는 영문

  if (!userIDRegExp.test(userID)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "아이디 정규식 영문자로 시작하는 영문자 또는 숫자 6-20",
    });
  }

  if (!passwordRegExp.test(password)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "비밀번호 정규식 8-16 문자, 숫자 조합",
    });
  }

  if (!nicknameRegExp.test(nickname)) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "닉네임 정규식 2-10 한글, 숫자 또는 영문",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      // 아이디 중복 검사
      const checkDuplicate = await indexDao.checkDuplicate(connection, userID);
     
      if(checkDuplicate){
        return res.send({
          isSuccess: false,
          code: 410,
          message: "이미 있는 아이디입니다. 다른 아이디를 입력해주세요."
        });
      }

      // 2. DB 입력
      const [rows] = await indexDao.insertUsers(
        connection,
        userID,
        password,
        nickname
      );

      // 입력된 유저 인덱스
      const userIdx = rows.insertId;  // insertId -> pk 반환

      // 3. JWT 발급
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname }, // payload 정의
        secret.jwtsecret // 서버 비밀키
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "회원가입 성공",
      });
    } catch (err) {
      logger.error(`createUsers Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createUsers DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
};

// 로그인
exports.createJwt = async function (req, res) {
  const { userID, password } = req.body;

  // null 값 체크
  if (!userID || !password) {
    return res.send({
      isSuccess: false,
      code: 400, // 요청 실패시 400번대 코드
      message: "회원정보를 입력해주세요.",
    });
  }

  try {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
      // 2. DB 회원 검증
      const [rows] = await indexDao.isValidUsers(connection, userID, password);

      if (rows.length < 1) {
        return res.send({
          isSuccess: false,
          code: 410, // 요청 실패시 400번대 코드
          message: "회원정보가 존재하지 않습니다.",
        });
      }

      const { userIdx, nickname } = rows[0];

      // 3. JWT 발급
      const token = jwt.sign(
        { userIdx: userIdx, nickname: nickname }, // payload 정의
        secret.jwtsecret // 서버 비밀키
      );

      return res.send({
        result: { jwt: token },
        isSuccess: true,
        code: 200, // 요청 실패시 400번대 코드
        message: "로그인 성공",
      });
    } catch (err) {
      logger.error(`createJwt Query error\n: ${JSON.stringify(err)}`);
      return false;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error(`createJwt DB Connection error\n: ${JSON.stringify(err)}`);
    return false;
  }
};

// 로그인 유지, 토큰 검증
exports.readJwt = async function (req, res) {
  const { userIdx, nickname } = req.verifiedToken;

  return res.send({
    result: { userIdx: userIdx, nickname: nickname },
    code: 200, // 요청 실패시 400번대 코드
    message: "유효한 토큰입니다.",
  });
};


// // 학생 테이블 조회
// exports.readStudents = async function(req, res){

//   // const {studentName} = req.query;
//   const {studentIdx} = req.params;
  
//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
//     try {
//       const [rows] = await indexDao.selectStudents(connection, studentIdx);

//       return res.send({
//         result: rows,
//         isSuccess: true,
//         code: 200, // 요청 실패시 400번대 코드
//         message: "요청 성공",
//       });
//     } catch (err) {
//       logger.error(`readStudents Query error\n: ${JSON.stringify(err)}`);
//       return false;
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     logger.error(`readStudents DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
// };

// // 학생 생성
// exports.createStudents = async function(req, res){

//   const {studentName, major, birth, address} = req.body;
//   console.log(studentName, major, birth, address)


//   // studentName, major, address : 문자열
//   if(
//     typeof studentName !== "string" || 
//     typeof major !== "string" || 
//     typeof address !== "string"
//     ) {
//     return res.send({
//       isSuccess: false,
//       code : 400, // 요청 실패시 400번대 코드
//       message : "값을 정확히 입력해주세요.",
//     });
//   }
//   // birth : YYYY-MM-DD 형식 검사
//   var regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
//   if(!regex.test(birth)){
//     return res.send({
//       isSuccess: false,
//       code : 400, // 요청 실패시 400번대 코드
//       message : "생년월일 형식을 확인해주세요.",
//     });
//   }
  
//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
//       try {
//         const [rows] = await indexDao.insertStudents(connection, studentName, major, birth, address);

//         return res.send({
//           isSuccess: true,
//           code: 200, // 요청 실패시 400번대 코드
//           message: "학생 생성 성공",
//         });
//       } catch (err) {
//         logger.error(`createStudents Query error\n: ${JSON.stringify(err)}`);
//         return false;
//       } finally {
//         connection.release();
//       }
//   } catch (err) {
//     logger.error(`createStudents DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
  
// };

// // 학생 정보 업데이트
// exports.updateStudent = async function(req, res){

//   const {studentIdx} = req.params;
//   const {studentName, major, birth, address} = req.body;
//   console.log(studentName, major, birth, address)

//   if (studentName && typeof studentName !== "string") {
//     return res.send({
//       isSuccess: false,
//       code : 400, // 요청 실패시 400번대 코드
//       message : "studentName 값을 정확히 입력해주세요.",
//     });
//   }
//   if (major && typeof major !== "string") {
//     return res.send({
//       isSuccess: false,
//       code : 400, // 요청 실패시 400번대 코드
//       message : "major 값을 정확히 입력해주세요.",
//     });
//   }
//   if (address && typeof address !== "string") {
//     return res.send({
//       isSuccess: false,
//       code : 400, // 요청 실패시 400번대 코드
//       message : "address 값을 정확히 입력해주세요.",
//     });
//   }

//   var regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
//   if (birth && !regex.test(birth)) {
//     return res.send({
//       isSuccess: false,
//       code : 400, // 요청 실패시 400번대 코드
//       message : "생년월일 형식을 확인해주세요.",
//     });
//   }
  
//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
      // try {
      //   const isValidStudentIdx = await indexDao.isValidStudentIdx(connection, studentIdx);
      //   if(!isValidStudentIdx){
      //     return res.send({
      //       isSuccess: false,
      //       code: 410, // 요청 실패시 400번대 코드
      //       message: "유효한 studentIdx가 아닙니다.",
      //     });
      //   }

//         console.log(1);

//         const [rows] = await indexDao.updateStudents(connection, studentIdx, studentName, major, birth, address);
        
//         console.log(2);

//         return res.send({
//           isSuccess: true,
//           code: 200, // 요청 실패시 400번대 코드
//           message: "학생 수정 성공",
//         });
//       } catch (err) {
//         logger.error(`updateStudent Query error\n: ${JSON.stringify(err)}`);
//         return false;
//       } finally {
//         connection.release();
//       }
//   } catch (err) {
//     logger.error(`updateStudent DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
// }

// // 학생 삭제
// exports.deleteStudent = async function (req, res) {
//   const {studentIdx} = req.params;
//     console.log("studentIdx++++++++++++++++++++++++++++++" + studentIdx);
//     try {
//       const connection = await pool.getConnection(async (conn) => conn);
//       try {
//         const isValidStudentIdx = await indexDao.isValidStudentIdx(connection, studentIdx);
//         if(!isValidStudentIdx){
//           return res.send({
//             isSuccess: false,
//             code: 410, // 요청 실패시 400번대 코드
//             message: "유효한 studentIdx가 아닙니다.",
//           });
//         }

//         const [rows] = await indexDao.deleteStudent(connection, studentIdx);
  
//         return res.send({
//           isSuccess: true,
//           code: 200, // 요청 실패시 400번대 코드
//           message: "요청 성공",
//         });
//       } catch (err) {
//         logger.error(`deleteStudent Query error\n: ${JSON.stringify(err)}`);
//         return false;
//       } finally {
//         connection.release();
//       }
//     } catch (err) {
//       logger.error(`deleteStudent DB Connection error\n: ${JSON.stringify(err)}`);
//       return false;
//     }
//   };
  

// 예시 코드
// exports.example = async function (req, res) {
//   try {
//     const connection = await pool.getConnection(async (conn) => conn);
//     try {
//       const [rows] = await indexDao.exampleDao(connection);

//       return res.send({
//         result: rows,
//         isSuccess: true,
//         code: 200, // 요청 실패시 400번대 코드
//         message: "요청 성공",
//       });
//     } catch (err) {
//       logger.error(`example Query error\n: ${JSON.stringify(err)}`);
//       return false;
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     logger.error(`example DB Connection error\n: ${JSON.stringify(err)}`);
//     return false;
//   }
// };
