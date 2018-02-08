const prefix = '/api/people';
export default class {
  request;

  constructor(request) {
    this.request = request;
  }

  get(key, filter) {
    return this.request(
      'get',
      `/api/people/search/${key}/${filter}`
    ).then((response) => {
      //console.log(response);
      return Promise.resolve({
        key,
        filter,
        data: response,
      });
    })
    .catch((response) => {
      return Promise.resolve({
        key,
        filter,
        data: response,
      });
    });
  }

  set(id, index, key, value) {
    if (value) {
      return this.request(
        'post',
        `/api/${key}s`,
        {
          peopleId: id,
        }
      )
      .then((response) => {
        return Promise.resolve({
          id,
          index,
          key,
          value,
          data: response,
        });
      })
      .catch((response) => {
        return Promise.resolve({
          key,
          data: response,
        });
      });
    } else {
      return this.request(
        'delete',
        `/api/${key}s/${id}`
      ).then((response) => {
        return Promise.resolve({
          id,
          index,
          key,
          value,
          data: response,
        });
      }).catch((response) => {
        return Promise.resolve({
          key,
          data: response,
        });
      });
    }
  }

  getPersonLogins(peopleId) {
    return this.request(
      'get',
      `${prefix}/${peopleId}/logins`,
    );
  }

  getUnconnectedLogins() {
    return this.request(
      'get',
      `${prefix}/getUnconnectedLogins`,
    );
  }

  connectLogin(personId, entityId, loginId) {
    return this.request(
      'post',
      `${prefix}/connectLogin/${personId}`,
      {
        entityId,
        loginId,
      }
    );
  }
}
