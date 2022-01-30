// import {header} from "./index.spec";

const LOCALES = ["ru-RU", "en-US"];
const COMPARE_OPTIONS = {sensitivity: "variant", caseFirst: "upper"};

export default class SortableTable {
  element = null;
  subElements = {};


  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.tableHeaderIdToConfig = new Map(headerConfig.map(header => [header.id, header]));

    this.render();
  }

  render() {
    this._initElement();
    this._initSubElements();
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

  sort(columnName, order = "asc") {
    this._sortData(columnName, order);
    this.subElements.body.innerHTML = this._getTableRows();
  }

  _sortData(columnName, order = "asc") {
    const neededHeaderConfig = this.tableHeaderIdToConfig.get(columnName);

    const orderByToCompareFunction = {
      "asc": {
        "string": (left, right) => (left[columnName].localeCompare(right[columnName], LOCALES, COMPARE_OPTIONS)),
        "number": (left, right) => (left[columnName] - right[columnName]),
      },
      "desc": {
        "string": (left, right) => (right[columnName].localeCompare(left[columnName], LOCALES, COMPARE_OPTIONS)),
        "number": (left, right) => (right[columnName] - left[columnName]),
      }
    };

    const compareFunction = orderByToCompareFunction[order][neededHeaderConfig.sortType];
    this.data = this.data.sort(compareFunction);
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

    return tableHeaderConfigs.map(
      header => `
        <div class="sortable-table__cell" data-id="${header.id}" data-sortable="${header.sortable}">
            <span>${header.title}</span>
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
      <a href="/products/${row.id}" class="sortable-table__row">
        ${prepareTableRowValues(row).join("")}
      </a>
    `).join("");
  }

}

