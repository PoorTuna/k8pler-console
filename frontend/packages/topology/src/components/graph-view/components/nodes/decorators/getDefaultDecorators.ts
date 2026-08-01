export const getEditDecorator = () =>
  import('./defaultDecorators' /* webpackChunkName: "topology" */).then((m) => m.getEditDecorator);

export const getUrlDecorator = () =>
  import('./defaultDecorators' /* webpackChunkName: "topology" */).then((m) => m.getUrlDecorator);

export const getAlertsDecorator = () =>
  import('./defaultDecorators' /* webpackChunkName: "topology" */).then(
    (m) => m.getAlertsDecorator,
  );
