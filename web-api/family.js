const prefix = '/api/family';

export default class {
  request;

  constructor(request) {
    this.request = request;
  }

  get(key, filter) {
    return this.request(
      'get',
      `${prefix}/search/${key}/${filter}`
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
      return request(
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

  uploadAvatar(id, type, file, fileName, mimeType, entityId) {
    return this.request(
      'post',
      `${prefix}/${id}/avatar`,
      {
        file,
        type,
        fileName,
        mimeType,
        entityId,
      }
    );
  }
}
