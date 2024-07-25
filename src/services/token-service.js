function setToken(token) {
  sessionStorage.setItem('token', token)
}


function getToken() {
	let token = sessionStorage.getItem("token");
	// if (token) {
	// 	// Check if token is expired
	// 	// remove all expired tokens!
	// 	const payload = JSON.parse(atob(token.split(".")[1]));
	// 	if (payload.exp < Date.now() / 1000) {
	// 		sessionStorage.removeItem("token");
	// 		token = null;
	// 	}
	// }
	// let test_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MjNmODUzYzAzNjVjOGQwNmI0YjJlNDciLCJjbGllbnRJZCI6InRyYWRpbmctdGVzdC1kZXYiLCJ0dGZDbGllbnRJZCI6IklSQUYiLCJleGNoYW5nZUlkcyI6W3siZXhjaGFuZ2UiOiJHZW1pbmkiLCJhY2NvdW50SWQiOiJ0cmFkaW5nLXRlc3QtZGV2IiwiX2lkIjoiNjIzZjg1M2MwMzY1YzhkMDZiNGIyZTQ4In1dLCJ0dXRvcmlhbEZsYWciOmZhbHNlLCJhdmF0YXIiOiIiLCJiYWxhbmNlcyI6W10sImNyZWF0ZWRBdCI6IjIwMjItMDMtMjZUMjE6Mjc6MjQuNzgzWiIsInVwZGF0ZWRBdCI6IjIwMjItMDUtMjNUMDU6MDE6MTAuNTUzWiIsIl9fdiI6MCwiZmF2b3JpdGVzIjpbIjFJTkNIIiwiQkNIIiwiTUFOQSIsIlpFQyJdLCJpYXQiOjE2NTQzMTAyNTQsImV4cCI6MTY1NDM5NjY1NH0.ZA1tl9lOclLlCWE0NDw8FhKTFWEEyTK970xgC2Hz-B8"
	return token;
}

function removeToken() {
  sessionStorage.removeItem('token')
}

export {
  setToken,
  //getUserFromToken,
  getToken,
  removeToken,
}