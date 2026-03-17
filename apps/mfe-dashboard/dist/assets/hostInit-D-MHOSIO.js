import { _ as __vitePreload } from './preload-helper-CqoC6PUU.js';

const remoteEntryPromise = __vitePreload(() => import('../remoteEntry.js'),true              ?[]:void 0);
    Promise.resolve(remoteEntryPromise)
      .then(remoteEntry => {
        return Promise.resolve(remoteEntry.__tla)
          .then(remoteEntry.init)
          .catch(remoteEntry.init)
      });
