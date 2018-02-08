import { observer, observable, action } from 'mobx';

export default class Base {
  api;
  error;
  cls;
  firebase;
  @observable options
  @observable db;
  @observable events;
  @observable settings;
  @observable props = observable.map();

  constructor(config) {
    if (config.db) {
      this.setupDb(config.db);
    }
    if (config.events) {
      this.setupEvents(config.events);
    }
    if (config.api) {
      this.setupApi(config.api);
    }
    if (config.onError) {
      this.setupError(config.onError);
    }
    if(config.cls) {
      this.cls = config.cls;
    }
    if(config.options) {
      this.options = config.options;
    }
    if(config.settings) {
      this.settings = config.settings;
    }
    if(config.firebase) {
      setupRequest(config.firebase);
    }
    if (typeof this.setup === 'function') {
      this.setup();
    }
  }

  setupApi(api) {
    this.api = api;
  }

  setupDb(db) {
    this.db = db;
  }

  setupEvents(events) {
    this.events = events;
  }

  setupFirebase(firebase) {
    this.firebase = firebase;
  }

  isNumeric(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
  }

  @action updateCollectionFields(collection, id, updates) {
    return this.db.updateCollectionFields(collection, id, updates);
  }

  @action deleteRecord(collection, id) {
    return this.db.deleteRecord(collection, id);
  }
}
