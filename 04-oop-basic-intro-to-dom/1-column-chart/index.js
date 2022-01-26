export default class ColumnChart {
  constructor(
    {
      data = [],
      label = "",
      value = 0,
      link = "",
      formatHeading = data => data
    } = {}
  ) {
    this.data = data;
    this.label = label;
    this.value = formatHeading(value);
    this.link = link;

    this._render();
  }

  get chartHeight() {
    return 50;
  }

  update (data) {
    this.data = data;
    this.subElements.body.innerHTML = this._getColumnTemplate();
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }

  _getColumnTemplate() {
    const maxValue = Math.max(...this.data);
    const scale = 50 / maxValue;

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

  _getLinkTemplate() {
    return this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : "";
  }

  _getTemplate () {
    return `
      <div class="column-chart ${!this.data.length ? 'column-chart_loading' : ''}"
            style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          ${this.label}
          ${this._getLinkTemplate()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">${this.value}</div>
          <div data-element="body" class="column-chart__chart">
            ${this._getColumnTemplate()}
          </div>
        </div>
      </div>
     `;
  }

  _render() {
    const divElement = document.createElement('div');
    divElement.innerHTML = this._getTemplate();
    this.element = divElement.firstElementChild;

    this.subElements = {};
    for (const subElement of this.element.querySelectorAll('[data-element]')) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }

}
