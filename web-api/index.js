import Auth from './auth';
import Family from './family';
import People from './people';
import Divisions from './divisions';
import Classes from './classes';
import Notes from './notes';
import Print from './print';
import Utils from './utils';

export default class {
  people;
  family;
  divisions;
  classes;
  notes;
  print;
  utils;
  events;
  request;

  constructor(request, events) {
    if (request) {
      this.init(request);
    }
    if (events) {
      this.setupEvents(events);
    }
  }

  setupRequest(request) {
    this.request = request;
  }

  init(request) {
    if (request) {
      this.setupRequest(request);
    }
    this.people = new People(this.request);
    this.family = new Family(this.request);
    this.divisions = new Divisions(this.request);
    this.classes = new Classes(this.request);
    this.notes = new Notes(this.request);
    this.print = new Print(this.request);
    this.auth = new Auth(this.request);
    this.utils = new Utils(this.request);
  }

  setupEvents(events) {
    const self = this;
    this.events = events;

    this.events.on('api', self.eventHandler.bind(this));
    return true;
  }

  eventHandler(type, payload) {
    if (type === 'update-request') {
      this.setupRequest(payload);
    }
  }
}
