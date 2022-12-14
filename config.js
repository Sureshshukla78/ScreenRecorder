var environments = {};
environments.test = {
  port: 3000,
  envName: "test",
};
environments.development = {
  port: 5000,
  envName: "development",
};
environments.production = {
  port: process.env.PORT || 3000,
  envName: "production",
};
console.log(process.env.NODE_ENV);

var currentEnvironment =
  typeof process.env.NODE_ENV == "string" ? process.env.NODE_ENV : "";

var environmentToExport =
  typeof environments[currentEnvironment] == "object"
    ? environments[currentEnvironment]
    : environments.test;

module.exports = environmentToExport;
