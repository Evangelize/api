import {
  observable,
  autorun,
  computed,
  toJS,
  action
} from 'mobx';
import {
  filter,
  sortBy,
  orderBy,
  first,
  map,
  reverse,
  find,
  uniqueId,
  pick,
  uniqBy
} from 'lodash/fp';
import axios from 'axios';
import Promise from 'bluebird';
import Base from './Base';

export default class Utils extends Base {
  @observable isUpdating = false;

  importUsers(data, families, people, reset) {
    return axios.post(
      '/api/import',
      {
        data,
        families,
        people,
        reset,
      }
    )
    .then(
      (response) => Promise.resolve(response.data)
    )
    .catch(
      (response) => Promise.resolve(response.data)
    );
  }
}
