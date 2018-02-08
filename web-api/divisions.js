import _ from 'lodash';

export default class {
  request;

  constructor(request) {
    this.request = request;
  }

  getConfigs() {
    return this.request(
      'get',
      '/api/divisions/configs'
    ).then((response) => {
      return Promise.resolve({
        divisionConfigs: response.data,
      });
    })
    .catch((response) => {
      return Promise.resolve({
        data: response.data,
      });
    });
  }
}
