import each from 'async/each';
import { observable, extendObservable } from 'mobx';
import auth from './auth';
import classes from './classes';
import Jobs from './jobs';
import Messages from './messages';
import People from './people';
import worship from './worship';
import settings from './settings';
import sockets from './sockets';
import utils from './utils';

const modules = [
  {
    name: 'auth',
    klass: auth,
  },
  {
    name: 'classes',
    klass: classes,
  },
  {
    name: 'jobs',
    klass: Jobs,
  },
  {
    name: 'messages',
    klass: Messages,
  },
  {
    name: 'people',
    klass: People,
  },
  {
    name: 'worship',
    klass: worship,
  },
  {
    name: 'settings',
    klass: settings,
  },
  {
    name: 'sockets',
    klass: sockets,
  },
  {
    name: 'utils',
    klass: utils,
  },
];

export default class {
  @observable stores = {
    auth: null,
    classes: null,
    jobs: null,
    messages: null,
    people: null,
    worship: null,
    settings: null,
    sockets: null,
    utils: null,
  };
  constructor(config) {
    const self = this;
    if (config) {
      this.init(config);
    }
  }

  init = (config) => {
    const self = this;
    return new Promise((resolve, reject) => {
      each(
        modules,
        (Mod, cb) => {
          const newConfig = Object.assign(
            {},
            config,
            {cls: self},
          );
          extendObservable(
            self.stores,
            {
              [Mod.name.toLowerCase()]: new Mod.klass(newConfig)
            }
          );
          cb();
        },
        (err) => {
          if (err) reject(err);
          resolve(self.stores);
        }
      );
    });
  }
};
