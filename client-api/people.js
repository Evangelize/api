import { action } from 'mobx';
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
import moment from 'moment-timezone';
import Base from './Base';

export default class People extends Base {
  findFamilies(search) {
    const regex = new RegExp(`^${search}`, 'i');
    return this.db.store.filter(
      'families', [
        filter((rec) => rec.deletedAt === null && regex.test(rec.name)),
        sortBy(['name']),
      ]
    );
  }

  getFamily(id) {
    return this.db.store.filter(
      'families', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  getFamilyMembers(familyId) {
    return this.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null && rec.familyId === familyId),
        sortBy(['firstName']),
      ]
    );
  }

  getGroups() {
    return this.db.store.filter(
      'groups', [
        filter((rec) => rec.deletedAt === null),
        sortBy(['title']),
      ]
    );
  }

  findGroups(search) {
    const regex = new RegExp(`^${search}`, 'i');
    return this.db.store.filter(
      'groups', [
        filter((rec) => rec.deletedAt === null && regex.test(rec.title)),
        sortBy(['name']),
      ]
    );
  }

  getGroup(id) {
    return this.db.store.filter(
      'groups', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  getGroupMembers(groupId) {
    const people = this.db.store.filter(
      'memberGroups', [
        filter((rec) => rec.deletedAt === null && rec.groupId === groupId),
        sortBy(['firstName']),
      ]
    );

    return (people) ? people.map((person) => {
      person.person = this.getPerson(person.personId);
      return person;
    }) : [];
  }
  

  @action updateGroup(group) {
    return this.db.updateStore('groups', group, false, false);
  }

  @action addPersonToGroup(personId, groupId) {
    const ts = moment().valueOf();
    let person = this.db.store.filter(
      'memberGroups', [
        filter((rec) => rec.deletedAt === null && rec.groupId === groupId && rec.personId === personId),
        first,
      ]
    );
    if (!person) {
      const record = {
        id: null,
        entityId: null,
        personId,
        groupId,
        createdAt: ts,
        updatedAt: ts,
        deletedAt: null,
      };
      person = this.db.updateStore('memberGroups', record, false, false);
    }
    return person;
  }

  @action deletePersonFromGroup(personId, groupId) {
    const ts = moment().valueOf();
    let retVal;
    let person = this.db.store.filter(
      'memberGroups', [
        filter((rec) => rec.deletedAt === null && rec.groupId === groupId && rec.personId === personId),
        first,
      ]
    );
    if (person) {
      retVal = this.deleteRecord('memberGroups', person.id)
    }
    return retVal;
  }

  findPeople(search, type, groupId, currentOnly) {
    const regex = new RegExp(`^${search}`, 'i');
    let retVal;
    if (currentOnly) {
      retVal = this.db.store.filter(
        'people', [
          filter((rec) => rec.deletedAt === null && regex.test(rec[type] && rec.membershipStatus === 'C')),
          sortBy(['lastName', 'firstName']),
        ]
      );
    } else {
      retVal = this.db.store.filter(
        'people', [
          filter((rec) => rec.deletedAt === null && regex.test(rec[type])),
          sortBy(['lastName', 'firstName']),
        ]
      );
    }

    if (groupId) {
      const groupMembers = this.getGroupMembers(groupId).map(m => m.personId);
      retVal = retVal.filter(r => groupMembers.includes(r.id))
    }

    return retVal;
  }

  getPerson(id) {
    return this.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  @action addPerson(person) {
    return this.db.updateStore('people', person, false, false);
  }

  @action createFamily() {
    return {
      id: null,
      entityId: window.entityId,
      name: null,
      familyName: null,
      address1: null,
      address2: null,
      city: null,
      state: null,
      zipCode: null,
      createdAt: moment().unix(),
      updatedAt: moment().unix(),
      deletedAt: null,
    }
  }

  @action async updatePersonAvatar(person, file, fileName, mimeType) {
    let retVal;
    const { utils } = this.api;
    try {
      const { data } = await utils.uploadAvatar(person.id, 'person', file, fileName, mimeType, this.db.entityId);
      person.photoUrl = data.photoUrl;
      retVal = data;
    } catch (e) {
      retVal = e;
    }

    return retVal;
  }

  @action async updateFamilyAvatar(family, file, fileName, mimeType) {
    let retVal;
    const { utils } = this.api;
    try {
      const { data } = await utils.uploadAvatar(family.id, 'family', file, fileName, mimeType, this.db.entityId);
      family.photoUrl = data.photoUrl;
      retVal = data;
    } catch (e) {
      retVal = e;
    }

    return retVal;
  }

  @action deletePersonFromFamily(person) {
    return this.updateCollectionFields('people', person.id, { familyId: null });
  }

  @action addPersonToFamily(person, familyId) {
    return this.updateCollectionFields('people', person.id, { familyId });
  }

  getCurrentMembers() {
    return this.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null && rec.membershipStatus === 'C'),
        sortBy(['lastName', 'firstName']),
      ]
    );
  }

  async getPersonLogins(personId) {
    return await this.api.people.getPersonLogins(personId);
  }

  async getUnconnectedLogins() {
    return await this.api.people.getUnconnectedLogins();
  }

  async connectLogin(personId, entityId, loginId) {
    return await this.api.people.connectLogin(personId, entityId, loginId);
  }
}