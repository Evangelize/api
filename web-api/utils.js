const prefix = '/api/utils';

export default class {
  request;

  constructor(request) {
    this.request = request;
  }

  uploadAvatar(id, type, file, fileName, mimeType, entityId) {
    return this.request(
      'post',
      `${prefix}/upload/${id}/avatar`,
      {
        file,
        type,
        fileName,
        mimeType,
        entityId,
      }
    );
  }

  getAllTables(lastUpdate) {
    return this.request(
      'post',
      `${prefix}/getAllTables`,
      {
        lastUpdate,
      },
      true
    );
  }
}
