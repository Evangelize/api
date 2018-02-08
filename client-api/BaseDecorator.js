import { observable, action } from 'mobx';

export default (target) => {
  return class extends target {
    api;
    error;
    cls;
    firebase;
    options = observable({});
    db = observable({});
    events = observable();
    settings = observable({});
  }
}
