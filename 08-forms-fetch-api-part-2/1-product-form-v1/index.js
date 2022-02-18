import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  element = null;
  subElements = {};

  productData = {};
  categoriesList = [];

  productDataConfig = {
    title: {
      placeholder: 'Название товара',
      valueType: 'text',
      defaultValue: ''
    },
    description: {
      placeholder: 'Описание товара',
      valueType: 'text',
      defaultValue: ''
    },
    quantity: {
      placeholder: 1,
      valueType: 'number',
      defaultValue: 1
    },
    subcategory: {
      valueType: 'text',
      defaultValue: ''
    },
    images: {
      valueType: 'array',
      defaultValue: [],
    },
    status: {
      valueType: 'number',
      defaultValue: 1
    },
    price: {
      placeholder: '100',
      valueType: 'number',
      defaultValue: 100
    },
    discount: {
      placeholder: '0',
      valueType: 'number',
      defaultValue: 0
    },

  }

  saveForm = async (event) => {
    event.preventDefault();
    await this.save();
  }

  uploadImage = async () => {
    const fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.addEventListener('change', async () => {
      const [file] = fileInput.files;

      if (file) {
        const formData = new FormData();
        const { uploadImage, imageListContainer } = this.subElements;

        formData.append('image', file);

        uploadImage.classList.add('is-loading');
        uploadImage.disabled = true;

        const result = await fetchJson('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          },
          body: formData,
          referrer: ''
        });

        imageListContainer.append(this.getImageElement(file.name, result.data.link));

        uploadImage.classList.remove('is-loading');
        uploadImage.disabled = false;

        // Remove input from body
        fileInput.remove();
      }
    });

    // must be in body for IE
    fileInput.hidden = true;
    document.body.append(fileInput);

    fileInput.click();
  };

  constructor (productId) {
    this.productId = productId;
  }

  async render () {
    await Promise.all([this.loadCategoriesList(), this.loadProductData()]);
    this.initElement();
    this.initSubElements();
    if (this.productData) {
      this.setProductForm();
    }
    this.initEventListeners();
    return this.element;
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
    const elementWrapper = document.createElement("div");
    elementWrapper.innerHTML = this.getTemplate();
    this.element = elementWrapper.firstElementChild;
  }

  initSubElements() {
    for (const subElement of this.element.querySelectorAll('[data-element]')) {
      this.subElements[subElement.dataset.element] = subElement;
    }
  }

  initEventListeners () {
    this.subElements.uploadImage.addEventListener("click", this.uploadImage);
    this.subElements.productForm.addEventListener("submit", this.saveForm);
  }

  async loadProductData () {
    if (!this.productId) {
      for (const [key, obj] of Object.entries(this.productDataConfig)) {
        this.productData[key] = obj.defaultValue;
      }
    } else {
      const url = new URL("api/rest/products", BACKEND_URL);
      url.searchParams.set("id", this.productId);
      const receivedData = await fetchJson(url);
      this.productData = receivedData[0];
    }
  }

  async loadCategoriesList () {
    const url = new URL("api/rest/categories", BACKEND_URL);
    url.searchParams.set("_sort", "weight");
    url.searchParams.set("_refs", "subcategory");
    this.categoriesList = await fetchJson(url);
  }

  async save () {
    try {
      const url = new URL("api/rest/products", BACKEND_URL);
      const body = this.getProductFormValues();

      const result = await fetchJson(url, {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      this.dispatchEvent(result.id);

    } catch (error) {
      console.error('ERROR', error);
    }
  }

  getProductFormValues () {
    const productFormValues = {id: this.productId};

    for (const [key, obj] of Object.entries(this.productDataConfig)) {
      if (key === "images") {
        continue;
      }
      let val = this.subElements.productForm.querySelector(`[name=${key}]`).value;
      if (obj.valueType === "number") {
        val = parseInt(val);
      }
      productFormValues[key] = val;
    }

    const imagesHTMLCollection = this.subElements.imageListContainer.querySelectorAll(
      '.sortable-table__cell-img');
    productFormValues.images = [];
    for (const image of imagesHTMLCollection) {
      productFormValues.images.push({url: image.src, source: image.alt});
    }

    return productFormValues;
  }

  setProductForm () {
    for (const key of Object.keys(this.productDataConfig)) {
      if (key === "images") {
        continue;
      }
      const element = this.subElements.productForm.querySelector(`[name=${key}]`);
      element.value = this.productData[key];
    }
  }

  getImageElement (name, url) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getImageTemplate(name, url);
    return wrapper.firstElementChild;
  }

  dispatchEvent (id) {
    const event = this.productId
      ? new CustomEvent('product-updated', { detail: id }) // new CustomEvent('click')
      : new CustomEvent('product-saved');

    this.element.dispatchEvent(event);
  }

  getTemplate () {
    return `
    <div class="product-form">
      <form data-element="productForm" class="form-grid">
        <div class="form-group form-group__half_left">
          <fieldset>
            <label class="form-label">Название товара</label>
            <input required
              id="title"
              value=""
              type="text"
              name="title"
              class="form-control"
              placeholder="Название товара">
          </fieldset>
        </div>
        <div class="form-group form-group__wide">
          <label class="form-label">Описание</label>
          <textarea required
            id="description"
            class="form-control"
            name="description"
            data-element="productDescription"
            placeholder="Описание товара"></textarea>
        </div>
        <div class="form-group form-group__wide">
          <label class="form-label">Фото</label>
          <ul class="sortable-list" data-element="imageListContainer">
            ${this.getImagesTemplate()}
          </ul>
          <button data-element="uploadImage" type="button" class="button-primary-outline">
            <span>Загрузить</span>
          </button>
        </div>
        <div class="form-group form-group__half_left">
          <label class="form-label">Категория</label>
            ${this.getCategoriesTemplate()}
        </div>
        <div class="form-group form-group__half_left form-group__two-col">
          <fieldset>
            <label class="form-label">Цена ($)</label>
            <input required
              id="price"
              value=""
              type="number"
              name="price"
              class="form-control"
              placeholder="${this.productDataConfig.price.placeholder}">
          </fieldset>
          <fieldset>
            <label class="form-label">Скидка ($)</label>
            <input required
              id="discount"
              value=""
              type="number"
              name="discount"
              class="form-control"
              placeholder="${this.productDataConfig.discount.placeholder}">
          </fieldset>
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Количество</label>
          <input required
            id="quantity"
            value=""
            type="number"
            class="form-control"
            name="quantity"
            placeholder="${this.productDataConfig.quantity.placeholder}">
        </div>
        <div class="form-group form-group__part-half">
          <label class="form-label">Статус</label>
          <select id="status" class="form-control" name="status">
            <option value="1">Активен</option>
            <option value="0">Неактивен</option>
          </select>
        </div>
        <div class="form-buttons">
          <button type="submit" name="save" class="button-primary-outline">
            Сохранить
          </button>
        </div>
      </form>
    </div>
    `;
  }

  getCategoriesTemplate () {
    const preparedCategories = [];
    for (const category of this.categoriesList) {
      for (const subcategory of category.subcategories) {
        preparedCategories.push(`<option value=${subcategory.id} > ${category.title} > ${subcategory.title}</option>`);
      }
    }
    return `
    <select class="form-control" id="subcategory" name="subcategory">
        ${preparedCategories.join("")}
    </select>
    `;
  }

  getImagesTemplate () {
    return this.productData.images.map(
      row => `
      ${this.getImageTemplate(row.source, row.url)}
    `).join("");
  }

  getImageTemplate (name, url) {
    return `
    <li class="products-edit__imagelist-item sortable-list__item">
      <span>
        <img src="./icon-grab.svg" data-grab-handle alt="grab">
        <img class="sortable-table__cell-img" alt="${escapeHtml(name)}" src="${escapeHtml(url)}">
        <span>${escapeHtml(name)}</span>
      </span>

      <button type="button">
        <img src="./icon-trash.svg" alt="delete" data-delete-handle>
      </button>
    </li>
    `;
  }
}
