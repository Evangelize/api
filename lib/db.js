import { extendObservable, observable, autorun, isObservable, isObservableMap, map, action, runInAction, toJS } from 'mobx';
import { create } from 'mobx-persist';
import { filter, pick, sortBy, first, take, remove } from 'lodash/fp';
import moment from 'moment-timezone';
import iouuid from 'innodb-optimized-uuid';
import localForage from 'localforage';
import { Database } from './database';

const storage = localForage.createInstance({
  name: 'evangelize',
  driver: localForage.INDEXEDDB,
});
const hydrate = create({ storage });

export default class {
  api;
  @observable store;
  @observable events;
  @observable entityId;

  constructor(events, api) {
    this.init(events, api);
  }

  init(events, api) {
    const self = this;
    if (events) {
      self.setupEvents(events);
    }
    if (api) {
      this.setupApi(api);
    }

    self.store = new Database();

    hydrate(
      'evangelize',
      self.store
    ).then(
      () => {
        console.log('evangelize hydrated');
      }
    );
  }

  setupApi(api) {
    this.api = api;
  }

  setupEvents(events) {
    const self = this;
    this.events = events;

    this.events.on('db', self.eventHandler.bind(this));
    return true;
  }

  setEntityId(entityId) {
    this.entityId = entityId;
  }

  collectionChange(collection, type, target) {
    console.log(moment().unix(), collection, type, target);
  }

  eventHandler(update) {
    const data = update.payload.data;
    let record;
    let deleted = false;
    let retValue = true;
    if (data.error) {
      if (data.error.name === 'SequelizeUniqueConstraintError') {
        record = this.store.filter(
          data.collection,
          [
            filter((rec) => rec.id === data.prior.id),
            first,
          ]
        );
        this.updateStore(data.collection, record, true, deleted);
        record = this.store.filter(
          data.collection,
          [
            filter((rec) => rec.id === data.record.id),
            first,
          ]
        );

        if (record) {
          deleted = (data.type === 'delete') ? true : false;
          record = Object.assign({}, record, data.record);
          retValue = this.updateStore(data.collection, record, true, deleted);
        } else if (data.type !== 'delete') {
          retValue = this.insertDocument(data.collection, data.record);
        }
      }
    } else if (data.type === 'insert' || data.type === 'update' || data.type === 'delete') {
      record = this.store.filter(
        data.collection,
        [
          filter((rec) => rec.id === data.record.id),
          first,
        ]
      );
      if (record) {
        deleted = (data.type === 'delete') ? true : false;
        record = Object.assign({}, record, data.record);
        retValue = this.updateStore(data.collection, record, true, deleted);
      } else if (data.type !== 'delete') {
        retValue = this.insertDocument(data.collection, data.record);
      }
    } else if (data.type === 'initialize') {
      this.store.initialize(data.collection);
      this.events.emit('app', 'databaseInit:complete');
    } else {
      retValue = false;
    }
    return retValue;
  }

  updateCollectionFields(collection, id, updates) {
    let retValue = true;
    let record = this.store.filter(
      collection,
      [
        filter((rec) => rec.id === id),
        first,
      ]
    );
    if (record) {
      record = Object.assign({}, record, updates);
      retValue = this.updateStore(collection, record, false);
    }

    return retValue;
  }

  @action deleteRecord(collection, id) {
    const ts = moment.utc().format('YYYY-MM-DDTHH:mm:ss.sssZ');
    const record = this.store.filter(
          collection,
          [
            filter((x) => x.id === id),
            first,
          ]
        );
    if (record) {
      record.deletedAt = ts;
      return this.updateStore(collection, record, false, true);
    } else {
      return null;
    }
  }

  @action updateStore(collection, record, remote, deleted) {
    console.log('updateStore', moment().unix());
    deleted = deleted || false;
    remote = remote || false;
    const ts = moment.utc().format('YYYY-MM-DDTHH:mm:ss.sssZ');
    const self = this;
    let results, type = 'insert';
    if (record) {
      if (record.id) {
        console.log('updateStore:pre-update', moment().unix());
        type = (deleted) ? 'delete' : 'update';
        record.updatedAt = ts;
        record.entityId = this.entityId;
        if (deleted) {
          results = record;
        } else {
          results = this.store.filter(
            collection,
            [
              filter((rec) => rec.id === record.id),
            ]
          );
          const newRecord = Object.assign(results[0], record);
          this.store.update(collection, newRecord);
          console.log('updateStore:updated', moment().unix());
        }
        if (!remote) this.sendRemote(record, type, collection);
      } else {
        record.createdAt = ts;
        record.updatedAt = ts;
        record.deletedAt = null;
        console.log('updateStore:pre-guid', moment().unix());
        record.id = iouuid.generate().toLowerCase();
        record.entityId = this.entityId;
        console.log('updateStore:guid', moment().unix());
        console.log('updateStore:pre-insert', moment().unix());

        this.store.update(collection, record);
        console.log('updateStore:inserted', moment().unix());
        if (!remote) this.sendRemote(record, type, collection);
      }
    }
    return record;
  }

  @action insertDocument(collection, record) {
    const self = this;
    return self.store.update(collection, record);
  }

  @action sendRemote(record, type, collection) {
    type = type || 'insert';
    const self = this;
    console.log('sendRemote:emit', moment().unix());
    self.events.emit(
      'socket',
      {
        type,
        collection,
        record: toJS(record),
        entityId: this.entityId,
      }
    );
  }
}
