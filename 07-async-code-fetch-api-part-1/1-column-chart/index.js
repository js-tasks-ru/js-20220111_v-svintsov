import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  chartHeight = 50;
  element = null;
  subElements = {};

  constructor(
    {
      data = [],
      url = "",
      range = {
        from: new Date(),
        to : new Date(),
      },
      label = "",
      link = "",
      formatHeading = data => data,
    } = {}
  ) {
    this.data = data;
    this.url = new URL(url, BACKEND_URL);
    this.range = range;
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;

    this.render();
    this.update(this.range.from, this.range.to);

  }

  render() {
    this.initElement();
    this.initSubElements();
  }

  initElement() {
    const divElement = document.createElement('div');
    divElement.innerHTML = this.getTemplate();
    this.element = divElement.firstElementChild;
  }

  initSubElements() {
    for (const subElement of this.element.querySelectorAll('[data-element]')) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }

  async update (from, to) {
    const loadDataResult = await this.loadData(from, to);

    this.data = Object.values(loadDataResult);
    this.updateRange(from, to);

    if (this.data.length) {
      this.subElements.body.innerHTML = this.getColumnTemplate();
      this.subElements.header.innerHTML = this.getHeaderValue();
      this.element.classList.remove('column-chart_loading');
    }
    return loadDataResult;
  }

  async loadData(from, to) {
    this.url.searchParams.set("from", from.toISOString());
    this.url.searchParams.set("to", to.toISOString());
    return await fetchJson(this.url);
  }

  updateRange (from, to) {
    this.range.from = from;
    this.range.to = to;
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }

  getHeaderValue() {
    return this.formatHeading(this.data.reduce((accum, item) => (accum + item), 0));
  }

  getColumnTemplate() {
    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;

    const preparedData = this.data.map(item => {
      return {
        percent: (item / maxValue * 100).toFixed(0) + '%',
        value: String(Math.floor(item * scale))
      };
    });

    return preparedData.map(item => {
      return `<div style="--value: ${item.value}" data-tooltip="${item.percent}"></div>`;
    }).join("");
  }

  getLinkTemplate() {
    return this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : "";
  }

  getHeaderTemplate() {
    return `
    <div data-element="header" class="column-chart__header">
        ${this.getHeaderValue()}
    </div>`;
  }

  getBodyTemplate() {
    return `
    <div data-element="body" class="column-chart__chart">
        ${this.getColumnTemplate()}
    </div>
    `;
  }

  getTemplate () {
    return `
      <div class="column-chart ${!this.data.length ? 'column-chart_loading' : ''}"
            style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          ${this.label}
          ${this.getLinkTemplate()}
        </div>
        <div class="column-chart__container">
          ${this.getHeaderTemplate()}
          ${this.getBodyTemplate()}
        </div>
      </div>
     `;
  }

}
