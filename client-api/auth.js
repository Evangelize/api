import {
  observable,
  autorun,
  computed,
  toJS,
  action
} from 'mobx';
import moment from 'moment-timezone';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import Base from './Base';

const cookieUserKey = 'evangelize-user-id';
const accessToken = 'accessToken';

export default class Auth extends Base {
  @observable authenticated = false;
  @observable showSplash = true;
  @observable user = {
    db: null,
    firebase: null,
  };
  @observable userId;
  @observable authToken;


  setupError(onError) {
    this.error = onError;
  }

  @action setUser(user) {
    this.user = user;
  }

  async setupAuth(user, fromDisk) {
    const self = this;
    if (fromDisk) {
      this.user = user;
    } else {
      this.user = {
        firebase: user,
        db: null,
        userId: user.uid,
      };
    }
    // const req = request(this.user.userId);
    //this.api.init(req);
    //Cookie.set(cookieUserKey, this.user.userId, { expires: 7 });
    console.log('user auth', user);
    try {
      const { jwt, user } = await this.checkUser();
      await this.finalizeLogin(jwt, user);
    } catch (e) {
      console.log(e);
    }
    return this.user;
  }

  @action async checkUser() {
    const { jwt, user } = await this.api.auth.thirdPartyLogin('google', this.user.firebase);
    return { jwt, user };
  }

  async login(type) {
    const self = this;
    const priorAuth = sessionStorage.getItem('auth-issue');
    let results;
    let error;
    let providers;
    let currUser = currentUser();
    if (this.user && this.user.firebase) {
      results = this.user.firebase;
    } else {
      try {
        if (type === 'facebook' && priorAuth) {
          results = await this.firebase.facebookAuthenticateRedirect();
        } else if (type === 'facebook') {
          results = await this.firebase.facebookAuthenticateRedirect();
        } else if (type === 'google' && priorAuth) {
          results = await this.firebase.googleAuthenticateRedirect();
        } else if (type === 'google') {
          results = await this.firebase.googleAuthenticateRedirect();
        }
        currUser = currentUser();
        self.user = {
          firebase: currUser,
          db: null,
          userId: currUser.uid,
        };
        self.userId = self.user.firebase.uid;
        const req = request(self.userId);
        this.api.init(req);
        await this.finalizeLogin();
      } catch (e) {
        error = e;
        if (error.code === 'auth/account-exists-with-different-credential') {
          providers = await this.firebase.fetchProvidersForEmail(error.email);
          console.log(providers);
        }
        this.error(e, null, null);
      }
    }
    console.log(error, results);
    return { error, results, providers };
  }

  getUserCookie() {
    return; //Cookie.get(cookieUserKey);
  }

  async finalizeLogin(jwt, user) {
    // await this.getAuthToken();
    // this.setupRefreshToken();
    // this.setupRequest();
    try {
      this.user.db = user;
      this.db.setEntityId(this.user.db.person.entityId || null);
      const tokn = jwtDecode(jwt);
      this.events.emit('settings', 'jwt', jwt);
      try {
        const data = await this.getAllTables();
        const payload = {
          payload: {
            data: {
              collection: data,
              type: 'initialize',
            },
          },
        };
        this.setShowSplash(false);
        this.authenticated = true;
        this.events.emit('db', payload);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.setShowSplash(false);
          console.log(error);
        }
        // this.error(error, null, null);
      }
    } catch (err) {
      if (err.response && err.response && err.response.status === 401) {
        console.log(err);
        this.setShowSplash(false);
      } else {
        this.setShowSplash(false);
        this.authenticated = true;
      }
      // this.error(err, null, null);
    }
    // this.setupUserProfile()
    this.events.emit('settings', 'user', this.user);
    return this.user;
  }

  setupEvents(events) {
    this.events = events;
    this.events.on('auth', this.eventHandler.bind(this));
  }

  eventHandler(event) {
    console.log(event);
  }

  async getAuthToken(force) {
    const redirectResult = await getRedirectResult();
    this.authToken = await this.user.firebase.getIdToken(true);
    return this.authToken;
  }

  setupRequest(request) {
    this.request = axios.create({
      timeout: 10000,
      headers: { 'X-Authorization': this.authToken },
    });

    this.request.interceptors.response.use(
      null, 
      (error) => {
        if (error.response && error.response.status === 401) {
          window.location = '/login';
        }
        console.log('error', error);
        this.error(error, null, null);
        throw error
      }
    )
  }

  async authenticate(email, password, callback) {
    const result = this.api.auth.login(email, password);
    if (result) {
      const token = jwtDecode(result.jwt);
      this.events.emit('settings', 'jwt', token);
      this.authenticated = true;
      console.log('user', result.user);
      this.user.db = result.user;
    } else {
      console.log('unauthorized');
    }
    return this.authenticated;
  }

  async getAllTables() {
    return await this.api.utils.getAllTables(this.db.store.lastUpdate);
  }

  @computed get userFullName() {
    const name = (this.user && this.user.db && this.user.db.person) ? this.user.db.person.firstName + ' ' + this.user.db.person.lastName : 'User Name';
    return name;
  }

  @action setShowSplash(state) {
    this.showSplash = state;
  }

}
