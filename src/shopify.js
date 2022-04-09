import { BUILD } from './constants';

export default class Shopify {

  constructor() {}

  get version() {
    return BUILD.version;
  }

}
