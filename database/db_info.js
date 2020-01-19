module.exports = (function () {
  return {
    local: { // localhost
      host: 'localhost',
      port: '3307',
      user: 'root',
      password: 'wnrud12',
      database: 'test'
    },
    real: { // real server db info
      host: '192.168.219.178',
      port: '3306',
      user: 'root',
      password: 'wnrud12',
      database: 'test'
    },
    dev: { // dev server db info
      host: '122.46.245.107',
      port: '50006',
      user: 'root',
      password: 'wnrud12',
      database: 'test'
    }
  }
})();
