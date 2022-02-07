import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  element = null;
  subElements = {};

  windowScrollHandler = async () => {
    const { bottom } = this.element.getBoundingClientRect();

    if (bottom < document.documentElement.clientHeight && !this.loadingLock && !this.isSortLocally) {
      this.start = this.end;
      this.end = this.start + this.step;

      this.loadingLock = true;
      await this.update(this.sorted.id, this.sorted.order, this.start, this.end);
      this.loadingLock = false;
    }
  }

  sortClickHandler = async (event) => {
    const headerCell = event.target.closest('[data-sortable="true"]');

    if (!headerCell) {
      return;
    }

    const columnName = headerCell.dataset.id;
    const currentOrder = headerCell.dataset.order;
    const newOrder = currentOrder === "asc" ? "desc" : "asc";
    await this.sort(columnName, newOrder);
    this.sorted = {id: columnName, order: newOrder};

    headerCell.dataset.order = newOrder;
    const arrow = headerCell.querySelector('.sortable-table__sort-arrow');
    if (!arrow) {
      headerCell.append(this.subElements.arrow);
    }
  }

  constructor(headersConfig, {
    data = [],
    url = "",
    sorted = {
      id: headersConfig.find(item => item.sortable).id,
      order: 'asc'
    },
    isSortLocally = false,
    step = 20,
    start = 1,
    end = start + step
  } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;

    this.url = new URL(url, BACKEND_URL);

    this.sorted = sorted;

    this.isSortLocally = isSortLocally;

    this.step = step;
    this.start = start;
    this.end = end;

    this.tableHeaderIdToConfig = new Map(this.headersConfig.map(header => [header.id, header]));

    this.render();

  }

  async render() {
    this.initElement();
    this.initSubElements();
    this.initEventListeners();
    await this.sort(this.sorted.id, this.sorted.order);
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

  initElement() {
    const divElement = document.createElement("div");
    divElement.innerHTML = this.getTemplate();
    this.element = divElement.firstElementChild;
  }

  initSubElements() {
    for (const subElement of this.element.querySelectorAll('[data-element]')) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }

  initEventListeners() {
    this.subElements.header.addEventListener("pointerdown", this.sortClickHandler);
    window.addEventListener('scroll', this.windowScrollHandler);
  }

  getTemplate() {
    return `
    <div class="sortable-table">
        ${this.getTableHeadersTemplate()}
        ${this.getTableRowsTemplate()}
    </div>
    `;
  }

  getTableHeadersTemplate() {
    return `
    <div data-element="header" class="sortable-table__header sortable-table__row">
      ${this.getTableHeader()}
    </div>
    `;
  }

  getTableRowsTemplate() {
    return `
    <div data-element="body" class="sortable-table__body">
        ${this.getTableRows()}
    </div>
    `;
  }

  getTableHeader() {
    const tableHeaderConfigs = [... this.tableHeaderIdToConfig.values()];

    const arrowTemplate = `
       <span data-element="arrow" class="sortable-table__sort-arrow">
         <span class="sort-arrow"></span>
       </span>
     `;

    return tableHeaderConfigs.map(
      header => `
        <div class="sortable-table__cell" data-id="${header.id}" data-sortable="${header.sortable}"
          data-order="${header.id === this.sorted.id ? this.sorted.order : "asc"}">
            <span>${header.title}</span>
            ${header.id === this.sorted.id ? arrowTemplate : ""}
        </div>
    `).join("");
  }

  getTableRows() {
    const tableHeaderIds = [... this.tableHeaderIdToConfig.keys()];

    const prepareTableRowValues = (row) => {
      return tableHeaderIds.map(
        headerId =>
          this.tableHeaderIdToConfig.get(headerId).template
            ? this.tableHeaderIdToConfig.get(headerId).template(row[headerId])
            : `<div class="sortable-table__cell">${row[headerId]}</div>`);
    };

    return this.data.map(
      row => `
      <a class="sortable-table__row">
        ${prepareTableRowValues(row).join("")}
      </a>
    `).join("");
  }

  async update (columnName, order, start, end) {
    await this.loadData(columnName, order, start, end, true);
    this.subElements.body.innerHTML = this.getTableRows();
  }

  async sort (columnName, order) {
    if (this.isSortLocally) {
      this.sortOnClient(columnName, order);
    } else {
      await this.sortOnServer(columnName, order);
    }
    this.subElements.body.innerHTML = this.getTableRows();
  }

  sortOnClient (columnName, order) {
    this.sortData(columnName, order);
  }

  async sortOnServer (columnName, order) {
    const start = 1;
    const end = start + this.step;
    await this.loadData(columnName, order, start, end);
  }

  async loadData(columnName, order, start = this.start, end = this.end, extendData = false) {
    this.url.searchParams.set('_sort', columnName);
    this.url.searchParams.set('_order', order);
    this.url.searchParams.set('_start', start);
    this.url.searchParams.set('_end', end);

    const receivedData = await fetchJson(this.url);
    if (!extendData) {
      this.data = receivedData;
    } else {
      this.data.push(...receivedData);
    }

    return this.data;
  }

  sortData(columnName, order = "asc") {
    const neededHeaderConfig = this.tableHeaderIdToConfig.get(columnName);
    const compareFunction = this.createCompareFunction(columnName, order, neededHeaderConfig.sortType);
    this.data.sort(compareFunction);
  }

  createCompareFunction (columnName, order = "asc", sortType = "string") {
    const direction = order === 'asc' ? 1 : -1;

    const sortTypeToCompareFunction = {
      "string": (a, b) => direction * (a[columnName].localeCompare(b[columnName],
        ["ru-RU", "en-US"], {sensitivity: "variant", caseFirst: "upper"})),
      "number": (a, b) => direction * (a[columnName] - b[columnName]),
    };

    const compareFunction = sortTypeToCompareFunction[sortType];

    return (a, b) => {
      return compareFunction(a, b);
    };
  }
}
