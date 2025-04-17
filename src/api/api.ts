export const getApiUrl = (): string => {
  // const protocol = window.location.protocol;
  // const hostname = window.location.hostname;
  // const port = window.location.port;

  // // @ts-ignore
  // if (import.meta.env.DEV) {
  //   return protocol + '//' + hostname + ':5000' + '/api';
  // } else {
  //   return protocol + '//' + hostname + (port ? ':' + port : '') + '/api';
  // }

  return '/api';
};
