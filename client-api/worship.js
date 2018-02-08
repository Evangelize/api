import {
  observable,
  autorun,
  computed,
  toJS,
  action,
  extendObservable
} from 'mobx';
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

export default class Worship extends Base {
  isNumeric(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
  }

  @action updateCollectionFields(collection, id, updates) {
    return this.db.updateCollectionFields(collection, id, updates);
  }

  @action deleteRecord(collection, id) {
    return this.db.deleteRecord(collection, id);
  }

  getServices() {
    return this.db.store.filter(
      'worshipServices', [
        filter((rec) => rec.deletedAt === null),
        orderBy(['day', 'time'], ['asc']),
      ]
    );
  }

  getService(id) {
    return this.db.store.filter(
      'worshipServices', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  getMonthServiceDays(month, year) {
    let days = [];
    const uniqueDays = this.db.store.filter(
      'worshipServices', [
        filter((rec) => rec.deletedAt === null),
        uniqBy('day'),
        orderBy(['day'], ['asc']),
      ]
    );

    uniqueDays.forEach((day) => {
      let dow = moment(`${year}${month}01`).startOf('month').day(day.day);
      while (month !== dow.format('MM') || day.day !== dow.day()) {
        dow = dow.add(1, 'days');
      }

      while (month === dow.format('MM')) {
        days.push(dow.valueOf());
        dow = dow.add(1, 'weeks');
      }
    });

    days = days.sort((a, b) => a - b);
    return days;
  }

  getServicesByDate(date) {
    const day = moment(date).day();
    return this.db.store.filter(
      'worshipServices', [
        filter((rec) => rec.deletedAt === null && rec.day === day),
        orderBy(['day', 'time'], ['asc']),
      ]
    );
  }

  getAttendanceTypes() {
    return this.db.store.filter(
      'attendanceTypes', [
        filter((rec) => rec.deletedAt === null),
        orderBy(['title'], ['absent']),
      ]
    );
  }

  getAttendanceCategoriesByType(type) {
    const absent = (type === 'present') ? false : true;
    return this.db.store.filter(
      'attendanceTypes', [
        filter((rec) => rec.deletedAt === null && rec.absent === absent),
        orderBy(['title'], ['absent']),
      ]
    );
  }

  getDefaultAttendanceType(type) {
    const absent = (type === 'present') ? false : true;
    return this.db.store.filter(
      'attendanceTypes', [
        filter((rec) => rec.deletedAt === null && rec.defaultType && rec.absent === absent),
        first,
      ]
    );
  }

  @action updateServiceOrder(id, currentPos, newPos) {
    let record = this.db.store.filter(
      'worshipServices', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
    if (record) {
      record = record.valueOf();
      record.order = newPos;
      this.db.updateStore('worshipServices', record, false);
    }
  }

  @action updateWorshipService(id, data, add) {
    let retVal = null;
    const ts = moment();
    if (add) {
      const newRecord = Object.assign(
        {}, 
        {
          id: null,
          revision: null,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        },
        data,
      );
      retVal = this.db.updateStore('worshipServices', newRecord, false);
    } else {
      const record = this.db.store.filter(
        'worshipServices', [
          filter((rec) => rec.deletedAt === null &&
            rec.id === id
          ),
          first,
        ]
      );
      if (record) {
        retVal = this.deleteRecord('worshipServices', record.id);
      }
    }
    return retVal;
  }

  @action updateAttendanceType(type) {
    this.db.updateStore('attendanceTypes', type, false);
  }

  getAttendanceByService(startMonth, endMonth) {
    startMonth = startMonth || moment(moment().format('MM/01/YYYY') + ' 00:00:00').subtract(3, 'month');
    endMonth = endMonth || moment(moment().format('MM/01/YYYY') + ' 00:00:00').valueOf();
    const presentTypes = this.getAttendanceCategoriesByType('present').map(t => t.id);
    let dailyAttendance = [];
    let latest = this.db.store.filter(
      'memberAttendance', [
        filter((rec) => rec.deletedAt === null
          && rec.attendanceDate >= startMonth
          && rec.attendanceDate <= endMonth
          && presentTypes.includes(rec.attendanceTypeId)
        ),
        sortBy('attendanceDate'),
        reverse,
      ]
    );
    latest = latest.reduce(
      (map, d) => {
        map[`${d.attendanceDate}|${d.worshipServiceId}`] = (map[`${d.attendanceDate}|${d.worshipServiceId}`] || 0) + 1;
        return map;
      },
      {}
    );
    Object.keys(latest).forEach((day) => {
      dailyAttendance.push({
        date: day,
        count: latest[day],
      });
    });
    /*
    dailyAttendance = _.sortBy(dailyAttendance, function(day){
        return day.date * -1;
    });
    */
    //console.log(dailyAttendance);
    return dailyAttendance;
  }

  getPersonWorshipAttendance(worshipDate, worshipServiceId, personId) {
    return this.db.store.filter(
      'memberAttendance', [
        find((rec) => rec.deletedAt === null && 
          rec.attendanceDate === worshipDate && 
          rec.worshipServiceId === worshipServiceId &&
          rec.personId === personId
        ),
      ]
    );
  }

  @action setMemberAttendanceType(attendanceTypeId, worshipServiceId, attendanceDate, personId) {
    const ts = moment().valueOf();
    let newRecord;
    const attendance = this.db.store.filter(
      'memberAttendance', [
        find((rec) => rec.deletedAt === null && 
          rec.attendanceDate === attendanceDate && 
          rec.worshipServiceId === worshipServiceId &&
          rec.personId === personId
        ),
      ]
    );
    if (attendance) {
      newRecord = Object.assign(
        {},
        attendance,
        {
          attendanceDate,
          attendanceTypeId,
          worshipServiceId,
          personId,
          updatedAt: ts,
          deletedAt: null,
        },
      );
    } else {
      newRecord = Object.assign(
        {},
        {
          id: null,
          attendanceDate,
          attendanceTypeId,
          worshipServiceId,
          personId,
          revision: null,
          createdAt: ts,
          updatedAt: ts,
          deletedAt: null,
        },
      );
    }
    const retVal = this.db.updateStore('memberAttendance', newRecord, false);
    return retVal;
  }
}
