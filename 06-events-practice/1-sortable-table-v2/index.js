export default class SortableTable {
  element = null;
  subElements = {};

  sortClickHandler = (event) => {
    const headerCell = event.target.closest('[data-sortable="true"]');

    if (!headerCell) {
      return;
    }

    const columnName = headerCell.dataset.id;
    const currentOrder = headerCell.dataset.order;
    const newOrder = currentOrder === "asc" ? "desc" : "asc";
    this._sortData(columnName, newOrder);
    headerCell.dataset.order = newOrder;

    const arrow = headerCell.querySelector('.sortable-table__sort-arrow');
    if (!arrow) {
      headerCell.append(this.subElements.arrow);
    }

    this.subElements.body.innerHTML = this._getTableRows();
  }

  constructor(headersConfig, {
    data = [],
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc'
    }
  } = {}) {
    this.headersConfig = headersConfig;
    this.data = data;
    this.sorted = sorted;

    this.tableHeaderIdToConfig = new Map(this.headersConfig.map(header => [header.id, header]));

    this.render();
  }

  render() {
    this._sortData(this.sorted.id, this.sorted.order);
    this._initElement();
    this._initSubElements();
    this._initEventListeners();
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

  _initElement() {
    const divElement = document.createElement("div");
    divElement.innerHTML = this._getTemplate();
    this.element = divElement.firstElementChild;
  }

  _initSubElements() {
    for (const subElement of this.element.querySelectorAll('[data-element]')) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }

  _initEventListeners() {
    this.subElements.header.addEventListener("pointerdown", this.sortClickHandler);
  }

  _getTemplate() {
    return `
    <div class="sortable-table">
        ${this._getTableHeadersTemplate()}
        ${this._getTableRowsTemplate()}
    </div>
    `;
  }

  _getTableHeadersTemplate() {
    return `
    <div data-element="header" class="sortable-table__header sortable-table__row">
      ${this._getTableHeader()}
    </div>
    `;
  }

  _getTableRowsTemplate() {
    return `
    <div data-element="body" class="sortable-table__body">
        ${this._getTableRows()}
    </div>
    `;
  }

  _getTableHeader() {
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

  _getTableRows() {
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

  _sortData(columnName, order = "asc") {
    const neededHeaderConfig = this.tableHeaderIdToConfig.get(columnName);
    const compareFunction = this._createCompareFunction(columnName, order, neededHeaderConfig.sortType);
    this.data.sort(compareFunction);
  }

  _createCompareFunction (columnName, order = "asc", sortType = "string") {
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
