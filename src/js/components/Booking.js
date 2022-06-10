import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

const log = console.log;

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.chosenTables = 0;
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =
      settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [startDateParam, settings.db.notRepeatParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };
    // console.log('get data params: ', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent:
        settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };
    //  console.log('urls', urls);

    Promise.all([fetch(urls.booking), fetch(urls.eventsCurrent), fetch(urls.eventsRepeat)])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    //console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDom();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      // console.log('loop', hourBlock);

      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDom() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);

      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element) {
    const thisWidget = this;

    const generatedHTML = templates.bookingWidget();

    thisWidget.dom = {};
    thisWidget.dom.wrapper = element;
    thisWidget.dom.wrapper.innerHTML = generatedHTML;

    thisWidget.dom.peopleAmount = thisWidget.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisWidget.dom.hoursAmount = thisWidget.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisWidget.dom.datePicker = thisWidget.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisWidget.dom.hourPicker = thisWidget.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisWidget.dom.tables = thisWidget.dom.wrapper.querySelectorAll(select.booking.tables);
  }

  initWidgets() {
    const thisWidget = this;
    thisWidget.peopleAmountWidget = new AmountWidget(thisWidget.dom.peopleAmount);
    thisWidget.hoursAmountWidget = new AmountWidget(thisWidget.dom.hoursAmount);

    thisWidget.datePicker = new DatePicker(thisWidget.dom.datePicker);
    thisWidget.hourPicker = new HourPicker(thisWidget.dom.hourPicker);

    thisWidget.dom.wrapper.addEventListener('updated', function () {
      thisWidget.updateDom();
    });

    thisWidget.dom.wrapper.addEventListener('click', function (event) {
      thisWidget.chooseTable(event);
    });
  }

  chooseTable(event) {
    const thisBooking = this;

    const clickedTable = event.target;
    //log('clickedTable', clickedTable);

    if (!clickedTable.classList.contains(classNames.booking.tableBooked)) {
      const clickedTableId = clickedTable.getAttribute('data-table');
      const otherTable = clickedTable.offsetParent.querySelector('.chosen');
      //log('other table', otherTable);

      if (otherTable && !clickedTable.classList.contains(classNames.booking.tableChosen)) {
        otherTable.classList.remove('chosen');
      }

      if (
        !thisBooking.chosenTables[clickedTableId] &&
        !clickedTable.classList.contains(classNames.booking.tableChosen)
      ) {
        clickedTable.classList.add(classNames.booking.tableChosen);

        thisBooking.chosenTables = clickedTableId;
      } else {
        //const clickedTableId = clickedTable.getAttribute('data-table');

        clickedTable.classList.remove(classNames.booking.tableChosen);
      }
    } else {
      window.alert('This table is taken, please choose another one');
    }

    //log('chosen tables', thisBooking.chosenTables);
  }
}

export default Booking;
