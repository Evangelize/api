import { observable } from 'mobx';
import { persist } from 'mobx-persist';
import flow from 'lodash.flow';
import concat from 'lodash.concat';
import moment from 'moment';
import * as Tables from './Tables';

export class Database {
  @persist('map', Tables.AttendanceType) @observable attendanceTypes = observable.map()
  @persist('map', Tables.ClassMeetingDay) @observable classMeetingDays = observable.map()
  @persist('map', Tables.Classes) @observable classes = observable.map()
  @persist('map', Tables.DivisionClassAttendance) @observable divisionClassAttendance = observable.map()
  @persist('map', Tables.DivisionClassTeacher) @observable divisionClassTeachers = observable.map()
  @persist('map', Tables.DivisionClass) @observable divisionClasses = observable.map()
  @persist('map', Tables.DivisionConfig) @observable divisionConfigs = observable.map()
  @persist('map', Tables.DivisionYear) @observable divisionYears = observable.map()
  @persist('map', Tables.Division) @observable divisions = observable.map()
  @persist('map', Tables.Family) @observable families = observable.map()
  @persist('map', Tables.FamilyCheckingAccount) @observable familyCheckingAccounts = observable.map()
  @persist('map', Tables.FamilyPayment) @observable familyPayments = observable.map()
  @persist('map', Tables.Group) @observable groups = observable.map()
  @persist('map', Tables.Job) @observable jobs = observable.map()
  @persist('map', Tables.MemberAttendance) @observable memberAttendance = observable.map()
  @persist('map', Tables.MemberJobAssignment) @observable memberJobAssignments = observable.map()
  @persist('map', Tables.MemberJobPreference) @observable memberJobPreferences = observable.map()
  @persist('map', Tables.MemberGroup) @observable memberGroups = observable.map()
  @persist('map', Tables.MemberSettings) @observable memberSettings = observable.map()
  @persist('map', Tables.Note) @observable notes = observable.map()
  @persist('map', Tables.People) @observable people = observable.map()
  @persist('map', Tables.Presentation) @observable presentations= observable.map()
  @persist('map', Tables.Posts) @observable posts = observable.map()
  @persist('map', Tables.Student) @observable students = observable.map()
  @persist('map', Tables.Teacher) @observable teachers = observable.map()
  @persist('map', Tables.ThirdPartyLogin) @observable thirdPartyLogins = observable.map()
  @persist('map', Tables.User) @observable users = observable.map()
  @persist('map', Tables.WorshipServiceJob) @observable worshipServiceJobs= observable.map()
  @persist('map', Tables.WorshipService) @observable worshipServices = observable.map()
  @persist('map', Tables.YearClassStudent) @observable yearClassStudents = observable.map()
  @persist('map', Tables.YearMeetingDay) @observable yearMeetingDays= observable.map()
  @persist @observable lastUpdate
  @persist @observable lastFullUpdate

  initialize(data) {
    const self = this;
    let isAnUpdate = false;
    Object.keys(data).forEach((table) => {
      const newData = data[table];
      const id = (table === 'users') ? 'peopleId' : 'id';
      if (newData.length) {
        isAnUpdate = true;
        console.log(table, id);
        const existing = self[table];
        const values = new Map(newData.map((i) => [i[id], i]));
        existing.merge(values);
      }
    });

    if (isAnUpdate) {
      this.setLastUpdate();
    }
    return this;
  }

  filter(table, funcs) {
    return flow(...concat([], funcs))(this[table].values());
  }

  update(table, record) {
    const id = (table === 'users') ? 'peopleId' : 'id';
    const existing = this[table];
    this.setLastUpdate();
    existing.set(record[id], record);
    return record;
  }

  setLastUpdate() {
    const now = moment().unix();
    if (!this.lastUpdate) {
      this.lastFullUpdate = now;
    }
    this.lastUpdate = now;
    console.log('db updated', this.lastUpdate);
  }
}
