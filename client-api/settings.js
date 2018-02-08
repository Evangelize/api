import {
  extendObservable,
  observable,
  computed,
  autorun,
  isObservable,
  isObservableMap,
  map,
  action
} from 'mobx';
import moment from 'moment-timezone';
import conv from 'binstring';
import iouuid from 'innodb-optimized-uuid';
import jwtDecode from 'jwt-decode';
import localForage from 'localforage';
import { FIXED_DRAWER, COLLAPSED_DRAWER, MINI_DRAWER, PERSISTENT_DRAWER } from '../constants';
import {
  AMBER,
  BLUE,
  CYAN,
  DARK_AMBER,
  DARK_BLUE,
  DARK_CYAN,
  DARK_DEEP_ORANGE,
  DARK_DEEP_PURPLE,
  DARK_GREEN,
  DARK_INDIGO,
  DARK_PINK,
  DARK_THEME_COLOR,
  DEEP_ORANGE,
  DEEP_PURPLE,
  GREEN,
  INDIGO,
  PINK
} from '../constants/ThemeColors';
import Base from './Base';

export default class Settings extends Base {
  request;
  @observable storage = localForage.createInstance({
    name: 'evangelize-settings',
    driver: localForage.INDEXEDDB,
  });
  @observable leftNavOpen = false;
  @observable config = {
    theme: INDIGO,
    drawerType: PERSISTENT_DRAWER,
    navOpen: false,
  };
  @observable appNotification = false;
  @observable messageNotification = false;

  setup() {
    // super(props);
  }

  async eventHandler(type, payload) {
    let retVal;
    switch(type) {
      case 'jwt':
        retVal = await this.setJwt(payload);
        break;
      case 'user':
        retVal = await this.setUser(payload);
        break;
      default:
        console.log('no handler for', type);
    }

    return retVal;
  }

  setupEvents(events) {
    this.events = events;
    this.events.on('settings', this.eventHandler.bind(this));
  }

  async setJwt(jwt) {
    const retVal = await this.storage.setItem('jwt', jwt);
    return retVal;
  }

  async getJwt() {
    const retVal = await this.storage.getItem('jwt');
    return retVal;
  }

  async setUser(user) {
    const retVal = await this.storage.setItem('user', user);
    return retVal;
  }

  async get(key) {
    const retVal = await this.storage.getItem(key);
    return retVal;
  }

  getTheme() {
    let retVal;
    if (this.config.theme) {
      retVal = this.config.theme;
    }
    return retVal;
  }

  getDrawerType() {
    return this.config.drawerType;
  }

  isNavOpen() {
    return this.config.navOpen;
  }

  @action toggleNavOpen() {
    console.log('toggleNavOpen');
    this.config.navOpen = !this.config.navOpen;
    //this.props.set('navOpen', !this.props.get('navOpen'));
  }
}
