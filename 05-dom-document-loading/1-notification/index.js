export default class NotificationMessage {
  static lastNotification = null;

  element = null;
  timerId = null;

  constructor(
    message = "",
    {
      duration = 1000,
      type = "success"
    } = {}) {
    this.message = message;
    this.duration = duration;
    this.type = type;

    this._initElement();
  }

  show(target = document.body) {
    if (NotificationMessage.lastNotification) {
      NotificationMessage.lastNotification.remove();
    }
    NotificationMessage.lastNotification = this;

    target.append(this.element);

    this.timerId = setTimeout(() => this.remove(), this.duration);
  }

  remove () {
    clearTimeout(this.timerId);
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.timerId = null;
    NotificationMessage.lastNotification = null;
  }

  _initElement () {
    const divElement = document.createElement("div");
    divElement.innerHTML = this._getTemplate();
    this.element = divElement.firstElementChild;
  }

  _getTemplate() {
    return `
    <div class="notification ${this.type}" style="--value:${this.duration / 1000 }s">
      <div class="timer"></div>
      <div class="inner-wrapper">
        <div class="notification-header">${this.type}</div>
        <div class="notification-body">
          ${this.message}
        </div>
      </div>
    </div>
    `;
  }
}
