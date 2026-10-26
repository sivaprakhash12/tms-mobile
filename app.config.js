module.exports = ({ config }) => {
  const isPredeploy = process.env.npm_lifecycle_event === 'predeploy';
  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(isPredeploy ? { baseUrl: '/tms-mobile' } : {}),
    },
  };
};
