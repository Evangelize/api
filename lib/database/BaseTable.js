import { observable } from 'mobx';
import { create, persist } from 'mobx-persist';

export default class BaseTable {
  @persist @observable id
  @persist @observable entityId
  @persist @observable createdAt
  @persist @observable updatedAt
  @persist @observable deletedAt
  @persist @observable revision
}