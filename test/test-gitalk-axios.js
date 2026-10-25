const assert = require('node:assert/strict');
const Module = require('node:module');
const test = require('node:test');

test('Gitalk 的发布包使用已更新的 Axios，而不是内置的旧版副本', () => {
  const entry = require.resolve('gitalk');
  const requireFromGitalk = Module.createRequire(entry);
  const axios = requireFromGitalk('axios');
  assert.equal(requireFromGitalk('axios/package.json').version, '0.34.0');

  const originalLoad = Module._load;
  const originalCreate = axios.create;
  const clients = [];
  axios.create = function (config) {
    const client = originalCreate.call(this, config);
    clients.push(client);
    return client;
  };
  let externalLoads = 0;
  Module._load = function (id, parent, ...args) {
    if (id === 'axios' && parent?.filename === entry) {
      externalLoads++;
    }
    return originalLoad.call(this, id, parent, ...args);
  };

  try {
    assert.equal(typeof require('gitalk'), 'function');
    assert.equal(externalLoads, 1);
    assert.equal(clients.length, 2);
    assert.equal(clients[1].defaults.baseURL, 'https://api.github.com');
    assert.equal(typeof clients[1].get, 'function');
    assert.equal(typeof clients[1].post, 'function');
  } finally {
    Module._load = originalLoad;
    axios.create = originalCreate;
    delete require.cache[entry];
  }
});
