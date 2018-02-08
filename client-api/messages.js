import { observable } from 'mobx';
import Base from './Base';

export default class Messages extends Base {
  subscribe(channel, cb) {
    this.events.on(channel, cb.bind(this));
  }
}
