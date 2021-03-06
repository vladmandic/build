import * as log from '@vladmandic/pilogger';

export function merge(...objects) {
  const isObject = (obj) => obj && typeof obj === 'object';
  return objects.reduce((prev, obj) => {
    Object.keys(obj || {}).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];
      // eslint-disable-next-line no-param-reassign
      if (Array.isArray(pVal) && Array.isArray(oVal)) prev[key] = pVal.concat(...oVal);
      // eslint-disable-next-line no-param-reassign
      else if (isObject(pVal) && isObject(oVal)) prev[key] = merge(pVal, oVal);
      // eslint-disable-next-line no-param-reassign
      else prev[key] = oVal;
    });
    return prev;
  }, {});
}

export const info = (type, application, environment, toolchain) => {
  log.info('Application:', application);
  log.info('Environment:', { profile: type, ...environment });
  log.info('Toolchain:', toolchain);
  // log.data('Configuration:', config);
};

export const results = () => {
  const ansiRegex = ({ onlyFirst = false } = {}) => {
    const pattern = '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))';
    return new RegExp(pattern, onlyFirst ? undefined : 'g');
  };
  const res: Record<string, unknown>[] = [];
  let facility = '';
  for (const line of log.ring) {
    let json: Record<string, unknown> = {};
    try {
      const obj = line.msg.match(/{(.*)}/);
      json = obj ? JSON.parse(obj[0]) : { msg: line.msg };
    } catch {
      json = { msg: line.msg };
    }
    if (json.msg) json.msg = (json['msg'] as string).replace(ansiRegex(), '');
    const facilityStr = line.msg.match(/(.*): /);
    const facilityExists = facilityStr && facilityStr.length > 1 ? facilityStr[1] : null;
    facility = facilityExists ? facilityExists.toLowerCase() : facility;
    res.push({ facility, level: line.tag, ...json });
  }
  return res;
};
