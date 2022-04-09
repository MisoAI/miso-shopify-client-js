const TAG_NAME = 'shopify-section';
const OBSERVED_ATTRIBUTES = ['path', 'section'];

export default class ShopifySectionElement extends HTMLElement {

  static get tagName() {
    return TAG_NAME;
  }

  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  constructor() {
    super();
  }

  set path(path) {
    this._path = path;
  }

  set section(section) {
    this._section = section;
  }

  async _syncContent() {
    this.innerHTML = await this._fetchContent();
  }

  async _fetchContent() {
    const response = await window.fetch(`${window.Shopify.routes.root}${this._path}?sections=${this._section}`);
    const body = await response.json();
    return body[this._section];
  }

  connectedCallback() {
    this._syncContent();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'path':
        this.path = newValue;
        break;
      case 'section':
        this.section = newValue;
        break;
    }
  }

}
