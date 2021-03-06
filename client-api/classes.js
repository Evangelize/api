import {
  observable,
  autorun,
  computed,
  toJS,
  action
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
import waterfall from 'async/waterfall';
import change from 'percent-change';
import Promise from 'bluebird';
import Base from './Base';

export default class Classes extends Base {
  @observable peopleFilter;
  @observable isUpdating = false;
  @observable peopleSearchResults;
  @observable divisionClassTeachersByDay;

  isNumeric(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
  }

  isClassDay(day) {
    day = this.isNumeric(day) ? day : moment().weekday();
    const classDay = this.getMeetingDay(day);

    return (classDay.length) ? true : false;
  }

  getDivisionConfigs() {
    return this.db.store.filter(
      'divisionConfigs', [
        filter((rec) => rec.deletedAt === null),
        sortBy('order'),
      ]
    );
  }

  getFirstDivisionConfig() {
    const record = this.db.store.filter(
      'divisionConfigs', [
        filter((rec) => rec.deletedAt === null),
        sortBy('order'),
        first
      ]
    );

    return (record) ? record : null;
  }

  getDivisionConfig(id) {
    return this.db.store.filter(
      'divisionConfigs', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  getClasses(excludes) {
    let records;
    if (excludes) {
      records = this.db.store.filter(
        'classes', [
          filter((rec) => rec.deletedAt === null &&
            excludes.indexOf(rec.id) === -1
          ),
          sortBy('order'),
        ]
      );
    } else {
      records = this.db.store.filter(
        'classes', [
          sortBy('order'),
        ]
      );
    }
    // console.log("years", years);
    return records;
  }

  getClassGroupingYears(divisionConfigId) {
    const records = this.db.store.filter(
      'divisionYears', [
        filter((rec) => rec.deletedAt === null && rec.divisionConfigId === divisionConfigId),
        orderBy(['endDate'], ['desc']),
      ]
    );
    // console.log("years", years);
    return records;
  }

  getClassGroupingYear(id) {
    return this.db.store.filter(
      'divisionYears', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  getDivision(id) {
    return this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  getCurrentDivisionYear(divisionConfigId) {
    const now = moment().valueOf();
    return this.db.store.filter(
      'divisionYears', [
        filter((rec) => rec.deletedAt === null &&
          rec.endDate >= now &&
          rec.startDate <= now &&
          rec.divisionConfigId === divisionConfigId),
        first,
      ]
    );
  }

  getDivisionScheduleOrdered(configId, yearId) {
    configId = configId || this.db.store.filter(
      'divisionConfigs', [
        first,
      ]
    );
    let now = moment().valueOf(),
      schedule, future = [],
      past = [];
    if (!yearId) {
      yearId = this.db.store.filter(
        'divisionYears', [
          filter((rec) => rec.deletedAt === null && rec.endDate >= now &&
            rec.startDate <= now && rec.divisionConfigId === configId),
          first,
        ]
      ).id;
    }
    schedule = this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null && rec.divisionYear >= yearId &&
          rec.divisionConfigId === configId),
      ]
    );
    schedule.forEach((div) => {
      if (moment(div.end).isSameOrAfter()) {
        future.push(div);
      } else {
        past.push(div);
      }
    });
    future = sortBy(future)('end');
    past = sortBy(past)('end');
    schedule = future.concat(past);
    //console.log("schedule", schedule);
    return schedule;
  }

  getDivisionSchedulesByPosition(yearId) {
    const records = this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null &&
          rec.divisionYear === yearId
        ),
        sortBy('position'),
      ]
    );
    return records;
  }

  getDivisionSchedules(yearId) {
    const records = this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null &&
          rec.divisionYear === yearId
        ),
        sortBy('end'),
      ]
    );
    return records;
  }

  getCurrentDivisionSchedule(yearId) {
    const now = moment().valueOf();
    return this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null &&
          rec.end >= now &&
          rec.start <= now &&
          rec.divisionYear === yearId
        ),
        sortBy('end'),
        first,
      ]
    );
  }

  async getDivisionSchedule(id) {
    const record = this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        sortBy('end'),
        first,
      ]
    );
    return record;
  }

  latestAttendance(day, length) {
    // console.log(day, length);
    const now = moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD')).subtract(length, 'week').valueOf();
    const latest = toJS(this.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null && rec.attendanceDate >= now && rec.day === day),
        sortBy('attendanceDate'),
      ]
    ));
    const latestR = latest.reduce(
      (mapping, d1) => {
        mapping[d1.attendanceDate] = (mapping[d1.attendanceDate] || 0) + d1.count;
        return mapping;
      }, {}
    );

    const result = Object.keys(latestR).map(function(k1) {
      return {
        attendance: latestR[k1],
        attendanceDate: parseInt(k1, 10)
      };
    });
    return result;
  }

  avgAttendance(day, begin, end) {
    day = day || 0;
    begin = begin || moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD')).subtract(4, 'week').valueOf();
    end = end || moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD HH:mm:ss')).valueOf();

    const latest = toJS(this.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null && rec.attendanceDate >= begin &&
          rec.attendanceDate <= end && rec.day === day),
        sortBy('attendanceDate'),
      ]
    )).reduce(
      (mapping, d1) => {
        mapping[d1.attendanceDate] = (mapping[d1.attendanceDate] || 0) + d1.count;
        return mapping;
      },
      Object.create(null)
    );
    let avg = 0;
    Object.keys(latest).forEach((date) => avg += latest[date]);
    avg = avg / Object.keys(latest).length;
    return avg.toFixed(0);
  }

  attendancePercentChange(day) {
    day = day || 0;
    const priorBegin = moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD')).subtract(8, 'week').valueOf();
    const priorEnd = moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD HH:mm:ss')).subtract(4, 'week').valueOf();
    const priorAvg = this.avgAttendance(day, priorBegin, priorEnd);
    const currAvg = this.avgAttendance(day);
    const percChange = change(priorAvg, currAvg, true);
    return percChange;
  }

  getGraphAttendance(day, length) {
    const attendance = this.latestAttendance(day, length);
    const labels = attendance.map((date) =>
      moment.utc(date.attendanceDate).tz('America/Chicago').format('MM/DD'));
    const series = attendance.map((date) => parseInt(date.attendance, 10));
    // console.log("graphAttendance", labels, series);
    return {
      labels,
      series: [series],
    };
  }

  getClassAttendance(classId, date) {
    date = date || moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD')).valueOf();
    const self = this;

    let retVal;
    const attendance = self.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null && rec.attendanceDate === date && rec.divisionClassId === classId),
      ]
    );
    if (attendance.length && attendance[0].count) {
      retVal = attendance[0].count.toString();
    } else {
      retVal = '0';
    }
    return retVal;

  }

  async getClassAttendanceToday(classId) {
    let today = moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD'));
    const records = this.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null && rec.divisionClassId === classId && rec.attendanceDate >= today),
      ]
    );
    return records;
  }

  getDailyAttendance(startMonth, endMonth) {
    startMonth = startMonth || moment(moment().format('MM/01/YYYY') + ' 00:00:00').subtract(3, 'month');
    endMonth = endMonth || moment(moment().format('MM/01/YYYY') + ' 00:00:00').valueOf();
    let dailyAttendance = [];
    let latest = this.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null && rec.attendanceDate >= startMonth && rec.attendanceDate <= endMonth),
        sortBy('attendanceDate'),
        reverse,
      ]
    );
    latest = latest.reduce(
      (map, d) => {
        map[d.attendanceDate] = (map[d.attendanceDate] || 0) + d.count;
        return map;
      },
      Object.create(null)
    );
    Object.keys(latest).forEach((day) => {
      dailyAttendance.push({
        date: parseInt(day, 10),
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

  getDailyAttendanceByDivision(divisionConfigId, startMonth, endMonth) {
    startMonth = startMonth || moment(moment().format('MM/01/YYYY') + ' 00:00:00').subtract(3, 'month');
    endMonth = endMonth || moment(moment().format('MM/01/YYYY') + ' 00:00:00').valueOf();
    const divisions = this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null &&
          rec.divisionConfigId === divisionConfigId &&
          rec.end >= startMonth &&
          rec.start <= endMonth
        ),
        map(rec => rec.id),
      ]
    );
    const divisionClasses = this.db.store.filter(
      'divisionClasses', [
        filter((rec) => rec.deletedAt === null &&
          divisions.indexOf(rec.divisionId) > -1
        ),
        map(rec => rec.id),
      ]
    );
    let dailyAttendance = [];
    let latest = this.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null &&
          rec.attendanceDate >= startMonth &&
          rec.attendanceDate <= endMonth &&
          (divisionClasses.indexOf(rec.divisionClassId) > -1)
        ),
        sortBy('attendanceDate'),
        reverse,
      ]
    );
    latest = latest.reduce(
      (map, d) => {
        map[d.attendanceDate] = (map[d.attendanceDate] || 0) + d.count;
        return map;
      },
      Object.create(null)
    );
    Object.keys(latest).forEach((day) => {
      dailyAttendance.push({
        date: parseInt(day, 10),
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

  getClassAttendanceByDay(classId, day, begin, end) {
    begin = begin || moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD')).subtract(8, 'week').valueOf();
    end = end || moment.utc(moment.tz('America/Chicago').format('YYYY-MM-DD')).valueOf();
    const divisionClasses = this.db.store.filter(
      'divisionClasses', [
        filter((rec) => rec.deletedAt === null && rec.classId === classId),
        map((rec) => rec.id),
      ]
    );
    const records = this.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null &&
          rec.day === day &&
          rec.attendanceDate >= begin &&
          rec.attendanceDate <= end &&
          (divisionClasses.indexOf(rec.divisionClassId) > -1)),
        sortBy('attendanceDate'),
      ]
    );
    return records;
  }

  getDayAttendance(date) {
    const self = this;
    return new Promise((resolve, reject) => {
      const attendance = self.db.store.filter(
        'divisionClassAttendance', [
          filter((rec) => rec.deletedAt === null && rec.attendanceDate >= parseInt(date, 10)),
          first,
        ]
      );
      const division = self.db.store.filter(
        'divisions', [
          filter((rec) => rec.deletedAt === null && rec.start <= parseInt(date, 10) && rec.end >= parseInt(date, 10)),
          first,
        ]
      );
      const divisionClasses = self.db.store.filter(
        'divisionClasses', [
          filter((rec) => rec.deletedAt === null && rec.divisionId === division.id),
          first,
        ]
      );
      const classes = self.db.store.filter(
        'classes', [
          sortBy('id'),
        ]
      );

      self.db.eqJoin(
        classes,
        divisionClasses,
        'id',
        'classId',
        (left, right) =>
        ({
          divisionClassId: right.id,
          classId: right.classId,
          divisionClasses: right,
          class: left,
        })
      ).then(
        (data) => {
          data = sortBy(data)('divisionClassId');
          data.forEach((cls) => {
            const classAttendance = find(attendance)({
              'divisionClassId': cls.divisionClassId
            });
            const divisionClassAttendance = (classAttendance) ? classAttendance : {
              count: 0,
              updatedAt: null
            };
            cls.divisionClassAttendance = divisionClassAttendance;
          });
          resolve(data);
        }
      );
    });
  }

  getAllCurrentYears(now) {
    const self = this;
    now = now || moment(moment.tz('America/Chicago').format('YYYY-MM-DD')).valueOf();
    const record = self.db.store.filter(
      'divisionYears', [
        filter((rec) => rec.deletedAt === null &&
          rec.endDate >= now &&
          rec.startDate <= now
        ),
        sortBy('end'),
      ]
    );
    return record;
  }

  getCurrentDivision(divisionConfigId, now) {
    const self = this;
    now = now || moment(moment.tz('America/Chicago').format('YYYY-MM-DD')).valueOf();
    const record = self.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null &&
          rec.end >= now &&
          rec.start <= now &&
          rec.divisionConfigId === divisionConfigId
        ),
        sortBy('end'),
        first,
      ]
    );
    console.log('getCurrentDivision', divisionConfigId, record);
    return record;
  }

  getAllCurrentDivisions(now) {
    const self = this;
    now = now || moment(moment.tz('America/Chicago').format('YYYY-MM-DD')).valueOf();
    const record = self.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null &&
          rec.end >= now &&
          rec.start <= now
        ),
        sortBy('end'),
      ]
    );
    return record;
  }

  getClassCurrentDivision(classId, now) {
    const self = this;
    now = now || moment(moment.tz('America/Chicago').format('YYYY-MM-DD')).valueOf();
    const allCurrentDivs = this.getAllCurrentDivisions(now);
    const ids = (allCurrentDivs.length) ? allCurrentDivs.map(obj => obj.id) : [];
    const record = self.db.store.filter(
      'divisionClasses', [
        filter((rec) => rec.deletedAt === null &&
          ids.indexOf(rec.divisionId) > -1 &&
          rec.classId === classId
        ),
        sortBy('end'),
        first,
      ]
    );
    return record;
  }

  getMeetingDay(day) {
    const now = moment().valueOf();
    const years = this.getAllCurrentYears(now).map(obj => obj.id);
    return this.db.store.filter(
      'yearMeetingDays', [
        filter((rec) => rec.deletedAt === null &&
          rec.dow === day &&
          years.indexOf(rec.yearId) > -1
        ),
      ]
    );
  }

  getCurrentDivisionMeetingDays(yearId, day) {
    return this.db.store.filter(
      'yearMeetingDays', [
        filter((rec) => rec.deletedAt === null &&
          rec.dow === parseInt(day, 10) &&
          rec.yearId === yearId
        ),
        first
      ]
    );
  }

  getGroupingCurrentYearMeetingDays(groupingId) {
    const year = this.getCurrentDivisionYear(groupingId);
    let retVal = [];
    if (year) {
      retVal = this.db.store.filter(
        'yearMeetingDays', [
          filter((rec) => rec.deletedAt === null &&
            rec.yearId === year.id
          ),
          sortBy('dow')
        ]
      );
    }
    return retVal;
  }

  getYearMeetingDays(yearId) {
    return this.db.store.filter(
      'yearMeetingDays', [
        filter((rec) => rec.deletedAt === null && rec.yearId === yearId),
      ]
    );
  }

  getDivisionMeetingDays(divisionConfigId) {
    const self = this;
    const records = self.db.store.filter(
      'classMeetingDays', [
        filter((rec) => rec.deletedAt === null && rec.divisionConfigId === divisionConfigId),
      ]
    );
    return records;
  }

  getCurrentDivisionClasses(divisionId) {
    const self = this;
    const divisionClasses = this.db.store.filter(
      'divisionClasses', [
        filter((rec) => rec.deletedAt === null && rec.divisionId === divisionId),
        sortBy('classId'),
      ]
    );
    const mapCls = divisionClasses.map(
      (divCls) => {
        const cls = self.getClass(divCls.classId); 
        const newCls = Object.assign(
          {},
          divCls,
          {
            class: cls,
            order: cls.order,
          }
        );
        return newCls;
      }
    );
    const result = sortBy(rec => rec.order)(mapCls);

    return result;
  }

  getDivisionConfigClasses(divisionConfigId, date, dow) {
    const self = this;
    date = date || moment(moment.tz('America/Chicago').format('YYYY-MM-DD')).valueOf();
    dow = this.isNumeric(dow) ? dow : moment().weekday();
    const division = this.getCurrentDivision(divisionConfigId, date);
    return (division) ? this.getCurrentDivisionClasses(division.id) : [];
  }

  getDivisionClass(divisionClassId) {
    const self = this;
    const divisionClass = self.db.store.filter(
      'divisionClasses', [
        filter((rec) => rec.deletedAt === null && rec.id === divisionClassId),
        first,
      ]
    );
    const division = self.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null && rec.id === divisionClass.divisionId),
        first,
      ]
    );
    const cls = self.db.store.filter(
      'classes', [
        filter((rec) => rec.deletedAt === null && rec.id === divisionClass.classId),
        first,
      ]
    );
    return observable(Object.assign({},
      divisionClass, {
        order: cls.order,
        class: cls,
        classId: cls.id,
        divisionId: division.id,
        id: divisionClass.id,
        divisionClass,
        division,
      }
    ));
  }

  getDivisionClassByDivisionAndClass(divisionId, classId) {
    const divisionClass = this.db.store.filter(
      'divisionClasses', [
        filter((rec) => rec.deletedAt === null && rec.divisionId === divisionId && rec.classId === classId),
        first,
      ]
    );

    return this.getDivisionClass(divisionClass.id);
  }

  getTeachers(teachers) {
    const ids = teachers.map((rec) => rec.peopleId);
    const people = this.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null && ids.indexOf(rec.id) > -1),
        sortBy(['lastName', 'firstName']),
      ]
    );
    return people.map((person) => {
      person.divClassTeacher = teachers.find(item => item.peopleId === person.id);
      return person;
    });
  }

  getCurrentClassTeachers(divisionClassId) {
    const self = this;
    return new Promise((resolve, reject) => {
      const day = moment().weekday();
      const divisionClassTeachers = self.db.store.filter(
        'divisionClassTeachers', [
          filter((rec) => rec.deletedAt === null && rec.day === day && rec.divisionClassId === divisionClassId),
          sortBy('classId'),
        ]
      );
      const people = self.db.store.filter(
        'people', []
      );
      self.db.eqJoin(
        people,
        divisionClassTeachers,
        'id',
        'peopleId',
        function(left, right) {
          return {
            person: left,
            divClassTeacher: right,
          };
        }
      ).then(
        function(data) {
          resolve(data);
        }
      ).catch(
        function(err) {
          reject(err);
        }
      );
    });
  }

  getDivisionClassTeacher(divisionClassId, peopleId) {
    const self = this;
    console.log('getDivisionClassTeacher:', divisionClassId, peopleId);
    const divisionClassTeacher = this.db.store.filter(
      'divisionClassTeachers', [
        filter((rec) => rec.deletedAt === null &&
          rec.divisionClassId === divisionClassId &&
          rec.peopleId === peopleId
        ),
        first,
      ]
    );
    const person = self.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null &&
          rec.id === peopleId
        ),
        first,
      ]
    );
    divisionClassTeacher.person = person;
    return divisionClassTeacher;
  }

  getClassTeachers(classId) {
    const divisionClasses = this.db.store.filter(
      'divisionClasses', [
        filter((rec) => rec.deletedAt === null && rec.classId === classId),
        map((rec) => rec.id),
      ]
    );
    return this.db.store.filter(
      'divisionClassTeachers', [
        filter((rec) => rec.deletedAt === null &&
          divisionClasses.indexOf(rec.divisionClassId) > -1
        ),
        uniqBy('peopleId'),
        sortBy('createdAt'),
      ]
    );
  }

  getDivisionClassTeachersByDayRaw(divisionClassId, day) {
    const self = this;
    console.log('getDivisionClassTeachersByDayRaw:', divisionClassId, day);
    return self.db.store.filter(
      'divisionClassTeachers', [
        filter((rec) => rec.deletedAt === null && rec.day === day && rec.divisionClassId === divisionClassId),
      ]
    );
  }

  getDivisionClassTeachersByDay(divisionClassId, day) {
    const self = this;
    console.log('getDivisionClassTeachersByDay:', divisionClassId, day);
    const divisionClassTeachers = self.db.store.filter(
      'divisionClassTeachers', [
        filter((rec) => rec.deletedAt === null && rec.day === day && rec.divisionClassId === divisionClassId),
        sortBy('classId'),
      ]
    );
    const people = self.db.store.filter(
      'people', []
    );
    return self.db.eqJoin(
      people,
      divisionClassTeachers,
      'id',
      'peopleId',
      (left, right) => ({
        id: right.id,
        person: left,
        divClassTeacher: right,
      })
    ).then(
      (data) => observable(data)
    );
  }

  getDivisionClassTeachersByDay2(divisionClassId, day) {
    const self = this;
    console.log('getDivisionClassTeachersByDay:', divisionClassId, day);
    const divisionClassTeachers = self.db.store.filter(
      'divisionClassTeachers', [
        filter((rec) => rec.deletedAt === null && rec.day === day && rec.divisionClassId === divisionClassId),
        sortBy('classId'),
      ]
    );
    const people = self.db.store.filter(
      'people', []
    );
    return self.db.eqJoin(
      people,
      divisionClassTeachers,
      'id',
      'peopleId',
      (left, right) => ({
        id: right.id,
        person: left,
        divClassTeacher: right,
      })
    ).then(
      (data) => observable(data)
    );
  }

  getDivisionClassTeachersGroupDay(divisionClassId) {
    const self = this;
    const meetingDays = this.getClassMeetingDays();
    return new Promise((resolve, reject) => {
      let retVal = {
        divisionClass: self.getDivisionClass(divisionClassId),
      };
      const fetchDay = function(day) {
        return self.getClassDayTeachers(retVal.divisionClass, day);
      };
      return Promise.map(
        meetingDays,
        fetchDay
      ).then(
        (result) => {
          retVal.days = result.resultset;
          resolve(retVal);
        }
      );
    });
  }

  getClassDayTeachers(divClass, day) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.getDivisionClassTeachersByDay(divClass.id, day.day).then(
        (result) => {
          let retVal = {};
          console.log('teachers', day.day, result);
          if (result.resultset.length) {
            retVal = {
              viewing: false,
              day,
              id: divClass.id,
              teachers: result.resultset,
            };
          } else {
            retVal = {
              day,
              viewing: false,
              id: divClass.id,
              teachers: [{
                id: uniqueId(),
                day: day.day,
                divisionClassId: divClass.id,
                peopleId: 0,
                person: {
                  lastName: 'Assigned',
                  firstName: 'Not',
                },
                divClassTeacher: {
                  confirmed: false,
                },
              }],
            };
          }
          resolve(retVal);
        }
      );
    });
  }

  getClassYearStudents(classId, yearId) {
    const classStudents = this.db.store.filter(
      'yearClassStudents', [
        filter((rec) => rec.deletedAt === null &&
          rec.classId === classId &&
          rec.yearId === yearId
        ),
        map(rec => rec.peopleId),
      ]
    );
    const records = this.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null &&
          classStudents.indexOf(rec.id) > -1
        ),
        orderBy(['lastName', 'firstName'], ['desc']),
      ]
    );

    return records;
  }

  getClassYearStudent(classId, yearId, peopleId) {
    return this.db.store.filter(
      'yearClassStudents', [
        filter((rec) => rec.deletedAt === null &&
          rec.classId === classId &&
          rec.yearId === yearId &&
          rec.peopleId === peopleId
        ),
        first,
      ]
    );
  }

  getAcademicYearMeetingDays(yearId) {
    return this.db.store.filter(
      'yearMeetingDays', [
        filter((rec) => rec.deletedAt === null &&
          rec.yearId === yearId
        ),
        sortBy('dow'),
      ]
    );
  }

  getClassMeetingDays() {
    return this.db.store.filter(
      'classMeetingDays', [
        filter((rec) => rec.deletedAt === null),
        sortBy('day'),
      ]
    );
  }

  getClass(classId) {
    return this.db.store.filter(
      'classes', [
        filter((rec) => rec.deletedAt === null && rec.id === classId),
        first,
      ]
    );
  }

  getNotes() {
    const records = this.db.store.filter(
      'notes', [
        filter((rec) => rec.deletedAt === null),
        sortBy('createdAt'),
      ]
    );
    return records;
  }

  findPeople(search, type) {
    const regex = new RegExp('^' + search, 'i');
    return this.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null && regex.test(rec[type])),
        sortBy(['lastName', 'firstName']),
      ]
    );
  }

  findFamilies(search) {
    const regex = new RegExp('^' + search, 'i');
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

  getPerson(id) {
    return this.db.store.filter(
      'people', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
  }

  async confirmTeacher(confirm, divClassId, teacherId) {
    let record = this.db.store.filter(
      'divisionClassTeachers', [
        filter((rec) => rec.deletedAt === null && rec.id === teacherId),
        first,
      ]
    );
    if (record) {
      record = record.valueOf();
      record.confirmed = confirm;
      this.db.updateStore('divisionClassTeachers', record, false);
    }

  }

  async updateClassOrder(classId, currentPos, newPos) {
    let record = this.db.store.filter(
      'classes', [
        filter((rec) => rec.deletedAt === null && rec.id === classId),
        first,
      ]
    );
    if (record) {
      record = record.valueOf();
      record.order = newPos;
      this.db.updateStore('classes', record, false);
    }

  }

  updateClassAttendance(divisionClassId, now, count, dayId) {
    console.log('updateClassAttendance', moment().unix());

    let record = this.db.store.filter(
      'divisionClassAttendance', [
        filter((rec) => rec.deletedAt === null &&
          rec.attendanceDate === now &&
          rec.divisionClassId === divisionClassId &&
          rec.dayId === dayId
        ),
        first,
      ]
    );
    if (!record) {
      record = {
        attendanceDate: now,
        count: parseInt(count, 10),
        createdAt: null,
        day: moment(now, 'x').weekday(),
        deletedAt: null,
        divisionClassId,
        dayId,
        id: null,
        revision: null,
        updatedAt: null,
      };
    } else {
      record = toJS(record);
      record.count = count;
    }
    console.log('updateClassAttendance:dispatch', moment().unix());
    return this.db.updateStore('divisionClassAttendance', record, false);
  }

  @action updateClassDayTeacher(divisionClassId, day, peopleId, dayId) {
    let newRecord;
    const record = this.db.store.filter(
      'divisionClassTeachers', [
        filter((rec) => rec.deletedAt === null && rec.peopleId === peopleId &&
          rec.day === day && rec.divisionClassId === divisionClassId),
        first,
      ]
    );
    if (!record) {
      newRecord = Object.assign({},
        toJS(record), {
          peopleId,
          day,
          divisionClassId,
          dayId,
          confirmed: false,
          id: null,
          revision: null,
          updatedAt: null,
          createdAt: null,
          deletedAt: null,
        }
      );
    } else {
      newRecord = Object.assign({}, toJS(record));
      newRecord.peopleId = peopleId;
      newRecord.day = day;
      newRecord.divisionClassId = divisionClassId;
    }
    return this.db.updateStore('divisionClassTeachers', newRecord, false);
  }

  @action updateClassGrouping(id, title, order) {
    let newRecord;
    const record = (id) ? this.getDivisionConfig(id) : id;
    if (!record) {
      newRecord = Object.assign({}, {
        title,
        id: null,
        order,
        revision: null,
        updatedAt: null,
        createdAt: null,
        deletedAt: null,
      });
    } else {
      newRecord = Object.assign({},
        toJS(record), {
          title,
          order,
        }
      );
    }
    return this.db.updateStore('divisionConfigs', newRecord, false);
  }

  @action updateClassGroupingOrder(id, currentPos, newPos) {
    let retVal = null;
    let record = this.db.store.filter(
      'divisionConfigs', [
        filter((rec) => rec.deletedAt === null && rec.id === id),
        first,
      ]
    );
    if (record) {
      record = record.valueOf();
      record.order = newPos;
      retVal = this.db.updateStore('divisionConfigs', record, false);
    }
    return retVal;
  }

  @action updateClassGroupingYear(id, classGroupingId, startDate, endDate) {
    let newRecord;
    const record = (id) ? this.getClassGroupingYear(id) : id;
    if (!record) {
      newRecord = Object.assign({}, {
        id: null,
        divisionConfigId: classGroupingId,
        startDate,
        endDate,
        revision: null,
        updatedAt: null,
        createdAt: null,
        deletedAt: null,
      });
    } else {
      newRecord = Object.assign({},
        toJS(record), {
          startDate,
          endDate
        }
      );
    }
    return this.db.updateStore('divisionYears', newRecord, false);
  }

  @action updateDivision(rec) {
    let newRecord;
    const record = ('id' in rec && rec.id) ? this.getClassGroupingYear(id) : null;
    if (!record) {
      newRecord = Object.assign({},
        rec
      );
    } else {
      newRecord = Object.assign({},
        toJS(record),
        rec
      );
    }
    return this.db.updateStore('divisions', newRecord, false);
  }

  @action updateDivisionOrder(divisionId, currentPos, newPos) {
    let retVal = null;
    let record = this.db.store.filter(
      'divisions', [
        filter((rec) => rec.deletedAt === null && rec.id === divisionId),
        first,
      ]
    );
    if (record) {
      record = record.valueOf();
      record.position = newPos;
      retVal = this.db.updateStore('divisions', record, false);
    }
    return retVal;
  }

  @action updateDivisionClass(classId, divisionId, add) {
    let retVal = null;
    if (add) {
      const newRecord = Object.assign({}, {
        id: null,
        divisionId,
        classId,
        revision: null,
        updatedAt: null,
        createdAt: null,
        deletedAt: null,
      });
      retVal = this.db.updateStore('divisionClasses', newRecord, false);
    } else {
      const record = this.db.store.filter(
        'divisionClasses', [
          filter((rec) => rec.deletedAt === null &&
            rec.classId === classId &&
            rec.divisionId === divisionId
          ),
          first,
        ]
      );
      if (record) {
        retVal = this.deleteRecord('divisionClasses', record.id);
      }
    }
    return retVal;
  }

  @action updateAcademicYearMeetingDay(yearId, dow, add) {
    let retVal = null;
    if (add) {
      const newRecord = Object.assign({}, {
        id: null,
        yearId,
        dow,
        revision: null,
        updatedAt: null,
        createdAt: null,
        deletedAt: null,
      });
      retVal = this.db.updateStore('yearMeetingDays', newRecord, false);
    } else {
      const record = this.db.store.filter(
        'yearMeetingDays', [
          filter((rec) => rec.deletedAt === null &&
            rec.yearId === yearId &&
            rec.dow === dow
          ),
          first,
        ]
      );
      if (record) {
        retVal = this.deleteRecord('yearMeetingDays', record.id);
      }
    }
    return retVal;
  }

  @action updateClassYearStudent(classId, yearId, peopleId) {
    let retVal = null;
    const newRecord = Object.assign({}, {
      id: null,
      yearId,
      classId,
      peopleId,
      revision: null,
      updatedAt: null,
      createdAt: null,
      deletedAt: null,
    });
    retVal = this.db.updateStore('yearClassStudents', newRecord, false);
    return retVal;
  }

  async printDivisionPlacards(divisionId) {
    const { data } = await this.api.print.divisionPlacards(divisionId);
    return data;
  }
}
