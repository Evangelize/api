import axios from 'axios';

export default (authToken, settings) => {
  authToken = authToken || 1234;
  const req = axios.create({
    baseURL: settings.serverUrl,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  const handleRequest = async (type, url, body, ignoreError) => {
    let results;
    try {
      const response = await req[type](url, body);
      results = response.data;
    } catch (err) {
      console.log(err, ignoreError);
      results = err;
      if (!ignoreError && err.response === 401) window.location = '/login';
    }
    return results;
  };

  return handleRequest;
};
