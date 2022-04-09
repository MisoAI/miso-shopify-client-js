import MisoClient from '@miso.ai/client-sdk';
import { getAnonymousUserToken, getCustomerId } from './event/user';
import InteractionObserver from './interaction';
//import ShopifySectionElement from './element/section';

import { getConfigFromScript } from './utils';

// anonymous ID
function getAnonymousIdFromUserToken() {
  const token = getAnonymousUserToken();
  return token ? `${token}` : undefined;
}

function getAnonymousIdFromLegacySessionKey() {
  return window.sessionStorage.getItem('misoAnonymousKey');
}

(() => {
  const ANONYMOUS_SESSION_KEY = 'miso-anonymous-id';
  if (window.sessionStorage.getItem(ANONYMOUS_SESSION_KEY)) {
    return;
  }
  // migrate to new session key
  const anonymousId = getAnonymousIdFromUserToken() || getAnonymousIdFromLegacySessionKey();
  if (anonymousId) {
    window.sessionStorage.setItem(ANONYMOUS_SESSION_KEY, anonymousId);
  }
})();

// user ID
const userId = getCustomerId();

function onError(e) {
  // TODO: send to MisoClient's error() method
}

(function init() {
  const apiKey = getConfigFromScript('api_key');
  if (!apiKey) {
    // TODO
    throw new Error('Expected api_key in script URL parameters');
  }

  MisoClient.plugins.use('std:ui');
  //MisoClient.ui.elements.register(ShopifySectionElement);

  const client = new MisoClient(apiKey);
  if (userId) {
    client.context.user_id = `${userId}`;
  }
  
  const interactionObserver = new InteractionObserver({ onError });
  interactionObserver.any((data) => client.api.interactions.upload(data));
  interactionObserver.start();
})();
