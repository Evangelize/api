import { observable } from 'mobx';
import { create, persist } from 'mobx-persist';
import BaseTable from './BaseTable';

export class AttendanceType extends BaseTable {
  @persist @observable title
  @persist @observable absent
  @persist @observable defaultType
}

export class Batch extends BaseTable {
  @persist @observable title
  @persist @observable open
}

export class ClassCoordinators extends BaseTable {
  @persist @observable personId
  @persist @observable classId
}

export class Classes extends BaseTable {
  @persist @observable title
  @persist @observable description
  @persist @observable order
}

export class ClassFile extends BaseTable {
  @persist @observable classId
  @persist @observable type
  @persist @observable title
}

export class ClassMeetingDay extends BaseTable {
  @persist @observable divisionConfigId
  @persist @observable day
}

export class ClassStudent extends BaseTable {
  @persist @observable type
  @persist @observable typeId
  @persist @observable classId
}

export class Cohort extends BaseTable {
  @persist @observable name
}

export class DivisionClassAttendance extends BaseTable {
  @persist @observable divisionClassId
  @persist @observable dayId
  @persist @observable day
  @persist @observable attendanceDate
  @persist @observable count
}

export class DivisionClass extends BaseTable {
  @persist @observable divisionId
  @persist @observable classId
}

export class DivisionClassTeacher extends BaseTable {
  @persist @observable divisionClassId
  @persist @observable peopleId
  @persist @observable dayId
  @persist @observable day
  @persist @observable confirmed
}

export class DivisionConfig extends BaseTable {
  @persist @observable title
  @persist @observable divisionName
  @persist @observable academicYearTitle
  @persist @observable divisonStart
  @persist @observable divisionLength
  @persist @observable divisionDayStartOrdinal
  @persist @observable divisionDayStartText
  @persist @observable divisionDayEndOrdinal
  @persist @observable divisionDayEndText
  @persist @observable order
}

export class Division extends BaseTable {
  @persist @observable divisionConfigId
  @persist @observable divisionYear
  @persist @observable position
  @persist @observable title
  @persist @observable start
  @persist @observable end
}

export class DivisionYear extends BaseTable {
  @persist @observable divisionConfigId
  @persist @observable startDate
  @persist @observable endDate
}

export class Entity extends BaseTable {
  @persist @observable title
  @persist @observable domain
}

export class Family extends BaseTable {
  @persist @observable name
  @persist @observable familyName
  @persist @observable address1
  @persist @observable address2
  @persist @observable city
  @persist @observable state
  @persist @observable zipCode
  @persist @observable photoUrl
}

export class FamilyCheckingAccount extends BaseTable {
  @persist @observable familyId
  @persist @observable account
}

export class FamilyPayment extends BaseTable {
  @persist @observable familyId
  @persist @observable accountId
  @persist @observable batchId
  @persist @observable number
  @persist @observable amount
  @persist @observable effectiveDate
}

export class File extends BaseTable {
  @persist @observable peopleId
  @persist @observable title
  @persist @observable description
  @persist @observable url
  @persist @observable shared
  @persist @observable globally
}

export class Group extends BaseTable {
  @persist @observable title
}

export class Job extends BaseTable {
  @persist @observable title
  @persist @observable active
  @persist @observable priority
  @persist @observable numPeople
  @persist @observable confirm
  @persist @observable ignore
  @persist @observable duration
}

export class MemberAttendance extends BaseTable {
  @persist @observable worshipServiceId
  @persist @observable personId
  @persist @observable attendanceDate
  @persist @observable day
  @persist @observable attendanceTypeId
}

export class MemberAvailibility extends BaseTable {
  @persist @observable personId
  @persist @observable start
  @persist @observable end
}

export class MemberDevice extends BaseTable {
  @persist @observable personId
  @persist @observable deviceId
  @persist @observable title
}

export class MemberGroup extends BaseTable {
  @persist @observable groupId
  @persist @observable personId
  @persist @observable rights
}

export class MemberJobAssignment extends BaseTable {
  @persist @observable worshipServiceId
  @persist @observable personId
  @persist @observable assignmentDate
  @persist @observable day
  @persist @observable jobId
  @persist @observable confirmed
  @persist @observable checkedIn
}

export class MemberJobPreference extends BaseTable {
  @persist @observable personId
  @persist @observable jobId
  @persist @observable confirmed
}

export class MemberSettings extends BaseTable {
  @persist @observable personId
  @persist @observable settings
  @persist @observable platform
  @persist @observable platformId
}

export class Note extends BaseTable {
  @persist @observable type
  @persist @observable typeId
  @persist @observable text
  @persist @observable title
  @persist @observable reminderDate
}

export class OverallAttendance extends BaseTable {
  @persist @observable worshipServiceId
  @persist @observable attendanceDate
  @persist @observable day
  @persist @observable count
}

export class People extends BaseTable {
  @persist @observable familyId
  @persist @observable cohortId
  @persist @observable lastName
  @persist @observable firstName
  @persist @observable familyPosition
  @persist @observable gender
  @persist @observable homePhoneNumber
  @persist @observable workPhoneNumber
  @persist @observable cellPhoneNumber
  @persist @observable emailAddress
  @persist @observable birthday
  @persist @observable nonChristian
  @persist @observable nonMember
  @persist @observable membershipStatus
  @persist @observable deceased
  @persist @observable collegeStudent
  @persist @observable photoUrl
  @persist @observable employer
  @persist @observable occupation
}

export class Presentation extends BaseTable {
  @persist @observable peopleId
  @persist @observable title
  @persist @observable presentation
  @persist @observable shared
  @persist @observable globally
}

export class Posts extends BaseTable {
  @persist @observable authorId
  @persist @observable title
  @persist @observable description
  @persist @observable body
  @persist @observable shared
  @persist @observable state
  @persist @observable featuredImage
}

export class Setting extends BaseTable {
  @persist @observable value
  @persist @observable key
}

export class Student extends BaseTable {
  @persist @observable peopleId
}

export class Teacher extends BaseTable {
  @persist @observable peopleId
}

export class TeacherSubstitution extends BaseTable {
  @persist @observable personId
  @persist @observable divisionClassId
  @persist @observable day
}

export class ThirdPartyLogin extends BaseTable {
  @persist @observable peopleId
  @persist @observable type
  @persist @observable externalId
}

export class User extends BaseTable {
  @persist @observable peopleid
  @persist @observable password
  @persist @observable active
}

export class WorshipServiceJob extends BaseTable {
  @persist @observable worshipServiceId
  @persist @observable day
  @persist @observable jobId
  @persist @observable title
  @persist @observable active
  @persist @observable priority
  @persist @observable numPeople
}

export class WorshipService extends BaseTable {
  @persist @observable day
  @persist @observable startTime
  @persist @observable title
  @persist @observable endTime
}

export class YearClassStudent extends BaseTable {
  @persist @observable classId
  @persist @observable peopleId
  @persist @observable yearId
}

export class YearMeetingDay extends BaseTable {
  @persist @observable yearId
  @persist @observable dow
}
