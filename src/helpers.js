const log = require('@vladmandic/pilogger');

function merge(...objects) {
  const isObject = (obj) => obj && typeof obj === 'object';
  return objects.reduce((prev, obj) => {
    Object.keys(obj || {}).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];
      if (Array.isArray(pVal) && Array.isArray(oVal)) prev[key] = pVal.concat(...oVal);
      else if (isObject(pVal) && isObject(oVal)) prev[key] = merge(pVal, oVal);
      else prev[key] = oVal;
    });
    return prev;
  }, {});
}

const info = (type, application, environment, toolchain) => {
  log.info('Application:', application);
  log.info('Environment:', { profile: type, ...environment });
  log.info('Toolchain:', toolchain);
  // log.data('Configuration:', config);
};

const results = () => {
  const ansiRegex = ({ onlyFirst = false } = {}) => {
    const pattern = '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))';
    return new RegExp(pattern, onlyFirst ? undefined : 'g');
  };
  const res = [];
  let facility = '';
  for (const line of log.ring) {
    const obj = line.msg.match(/{(.*)}/);
    const json = obj && obj.length > 0 ? JSON.parse(line.msg.match(/{(.*)}/)[0]) : { msg: line.msg };
    if (json.msg) json.msg = json.msg.replace(ansiRegex(), '');
    const facilityStr = line.msg.match(/(.*): /);
    const facilityExists = facilityStr && facilityStr.length > 1 ? facilityStr[1] : null;
    facility = facilityExists ? facilityExists.toLowerCase() : facility;
    res.push({ facility, level: line.tag, ...json });
  }
  return res;
};

exports.merge = merge;
exports.info = info;
exports.results = results;
