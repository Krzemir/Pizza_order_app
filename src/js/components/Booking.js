import { templates, select } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(element) {
    this.render(element);

    this.initWidgets();
  }

  render(element) {
    const thisWidget = this;

    const generatedHTML = templates.bookingWidget();

    thisWidget.dom = {};
    thisWidget.dom.wrapper = element;
    thisWidget.dom.wrapper.innerHTML = generatedHTML;

    thisWidget.dom.peopleAmount = thisWidget.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisWidget.dom.hoursAmount = thisWidget.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisWidget.dom.datePicker = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisWidget.dom.hourPicker = thisWidget.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
  }

  initWidgets() {
    const thisWidget = this;
    thisWidget.peopleAmountWidget = new AmountWidget(thisWidget.dom.peopleAmount);
    thisWidget.hoursAmountWidget = new AmountWidget(thisWidget.dom.hoursAmount);

    thisWidget.datePicker = new DatePicker(thisWidget.dom.datePicker);
    thisWidget.hourPicker = new HourPicker(thisWidget.dom.hourPicker);

    thisWidget.dom.wrapper.addEventListener('updated', function () {});
  }
}

export default Booking;
