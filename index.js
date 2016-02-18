'use strict';

const lodash = require('lodash');
const isPromise = require('is-promise');

function Processors(baseClass) {

  class Model extends baseClass {

    processCollection (objs, tags) {

      let pms = [];
      for (const obj of objs) {
        pms.push(this.process(objs, tags));
      }
      return Promise.all(pms);
    }

    process (obj, tags) {
      tags = Array.isArray(tags) ? tags : [tags];

      const processors = this.processors || {};

      const promises = [];
      const promiseMap = [];
      const out = lodash.cloneDeep(obj);

      for (let tag of tags) {
        promises[tag] = {}
        for (let field of Object.keys(processors[tag] || {})) {
          let pm = processors[tag][field](obj[field], obj);
          if (!isPromise(pm)) {
            pm = Promise.resolve(pm);
          }
          promises.push(pm);
          promiseMap.push(field);
        }
      }
      return Promise.all(promises)
      .then((values) => {

        for (let value of values) {
          const field = promiseMap.shift();
          out[field] = value;
        }
        return Promise.resolve(out);
      });
    }

  }

  Model.capabilities.add('processors');
  return Model;
}

module.exports = Processors;
