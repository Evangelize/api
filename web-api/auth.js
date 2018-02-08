export default class {
  request;

  constructor(request) {
    this.request = request;
  }

  login(email, password) {
    return this.request(
      'post',
      '/api/auth/login',
      {
        email,
        password,
      }
    );
  }

  thirdPartyLogin(type, token) {
    return this.request(
      'post',
      '/api/auth/thirdPartyLogin',
      {
        type,
        token,
      }
    );
  }
}
