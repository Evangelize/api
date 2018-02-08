const prefix = '/api/print';
export default class {
  request;

  constructor(request) {
    this.request = request;
  }

  divisionPlacards(divisionId) {
    return this.request(
      'get',
      `${prefix}/division/${divisionId}/placards`
    );
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
    }
  }
}
