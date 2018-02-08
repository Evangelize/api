export default class {
  request;

  constructor(request) {
    this.request = request;
  }

  manageTeacher(type, divisionConfigId, yearId, divisionId, divisionClassId, day, personId, opts = null) {
    switch (type) {
      case 'add':
        return this.request(
          'post',
          `/api/classes/${divisionClassId}/teacher`,
          {
            divisionClassId,
            peopleId: personId,
            day,
          }
        )
        .then((response) => {
          return Promise.resolve({
            data: response,
            divisionConfigId,
            yearId,
            divisionId,
            divisionClassId,
          });
        })
        .catch((response) => {
          return Promise.resolve({
            data: response,
          });
        });
      case 'delete':
        return this.request(
          'delete',
          `/api/classes/${divisionClassId}/teacher/${personId}`
        )
        .then((response) => {
          return Promise.resolve({
            data: response,
            divisionConfigId,
            yearId,
            divisionId,
            divisionClassId,
          });
        })
        .catch((response) => {
          return Promise.resolve({
            data: response,
          });
        });
      case 'confirm':
      case 'unconfirm':
        return this.request(
          'put',
          `/api/classes/${divisionClassId}/teacher/${personId}`,
          {
            confirmed: opts.confirmed,
          }
        )
        .then((response) => {
          return Promise.resolve({
            data: response,
            divisionConfigId,
            yearId,
            divisionId,
            divisionClassId,
          });
        })
        .catch((response) => {
          return Promise.resolve({
            data: response,
          });
        });
      default:
        break;
    }
  }

  updateClassAttendance(divisionClassId, day, attendanceDate, count) {
    return this.request(
      'post',
      `/api/classes/${divisionClassId}/attendance/${day}`,
      {
        attendanceDate,
        count,
      }
    )
    .then((response) => {
      return Promise.resolve({
        data: response,
        divisionClassId,
        attendanceDate,
        day,
      });
    })
    .catch((response) => {
      return Promise.resolve({
        data: response,
      });
    });
  }
}
