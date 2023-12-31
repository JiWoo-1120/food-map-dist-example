const { pool } = require("../../config/database");

// 식당 목록 조회
exports.selectreadRestaurants = async function (connection, category){
  const selectAllRestaurantsQuery = `SELECT title, address, category, videoUrl FROM table1 WHERE status = 'A'`;
  const selectCategorizedRestaurantsQuery = `SELECT title, address, category, videoUrl FROM table1 WHERE status = 'A' and category = ?;`;
  
  const Params = [category];

  const Query = category ? selectCategorizedRestaurantsQuery : selectAllRestaurantsQuery;

  const rows = await connection.query(Query, Params);

  return rows;
};

// 회원가입
exports.insertUsers = async function (connection, userID, password, nickname) {
  const Query = `insert into Users(userID, password, nickname) values (?,?,?);`;
  const Params = [userID, password, nickname];

  const rows = await connection.query(Query, Params);

  return rows;
};

// 아이디 중복 검사
exports.checkDuplicate = async function(connection, userID){
  const Query = `SELECT userID FROM Users WHERE userID = ?;`;
  const Params = [userID];

  const [rows] = await connection.query(Query, Params);
  
  if(rows.length >= 1){
    return true;
  }

  return false;
};

// 로그인 (회원검증)
exports.isValidUsers = async function (connection, userID, password) {
  const Query = `SELECT userIdx, nickname FROM Users where userID = ? and password = ? and status = 'A';`;
  const Params = [userID, password];

  const rows = await connection.query(Query, Params);

  return rows;
};



// // 학생 전체 조회
// exports.selectStudents = async function (connection, studentIdx) {
//   const Query = `SELECT * FROM Students WHERE studentIdx = ?;`;
//   const Params = [studentIdx];

//   const rows = await connection.query(Query, Params);

//   return rows;
// };


// // 학생 저장
// exports.insertStudents = async function (connection, studentName, major, birth, address) {
//   const Query = `INSERT INTO Students(studentName, major, birth, address) VALUES (?, ?, ?, ?);`;
//   const Params = [studentName, major, birth, address];

//   const rows = await connection.query(Query, Params);

//   return rows;
// };

// // studentIdx 체크
// exports.isValidStudentIdx = async function (connection, studentIdx) {
//   const Query = `SELECT * FROM Students WHERE studentIdx = ? and status = 'A';`;
//   const Params = [studentIdx];

//   const [rows] = await connection.query(Query, Params);

//   if (rows  < 1){
//     return false;
//   }
  
//   return true;
// };

// // 학생 정보 업데이트
// exports.updateStudents = async function (connection, studentIdx, studentName, major, birth, address) {
//   const Query = `update Students set studentName = ifnull(?, studentName), major = ifnull(?, major), birth = ifnull(?, birth), address = ifnull(?, address) where studentIdx = ?;`;
//   const Params = [studentName, major, birth, address, studentIdx];

//   const rows = await connection.query(Query, Params);
 
//   return rows;
// };


// // 학생 삭제
// exports.deleteStudent = async function (connection, studentIdx) {
//   const Query = `update Students set status = "D" where studentIdx = ?;`;
//   const Params = [studentIdx];

//   const rows = await connection.query(Query, Params);
 
//   return rows;
// };
// exports.exampleDao = async function (connection) {
//   const Query = `SELECT * FROM Students;`;
//   const Params = [];

//   const rows = await connection.query(Query, Params);

//   return rows;
// };

