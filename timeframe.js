Date.weekdays = $w('Sunday Monday Tuesday Wednesday Thursday Friday Saturday');
Date.months   = $w('January February March April May June July August September October November December');

var Timeframes = [];

var Timeframe = Class.create({
 /**
  * Syntax:
  * 
  * new Timeframe('el_id', {
  *   calendars: 2,
  *   weekoffset: 0
  * });
  */
  Version: '0.1 Calamari',
  
  initialize: function(element, options) {
    Timeframes.push(this);
    
    this.container = $(element);
    this.disableSelection(this.container);
    
    this.options = $H({
      calendars:   2,
      format:      '%b %d, %Y',
      weekoffset:  0
    }).merge(options || {});
    
    this.calendars = this.options.get('calendars');
    
    // Look for custom buttons:
    this.buttons = $H({
      previous: $(this.options.get('previousbutton')),
      today:    $(this.options.get('todaybutton')),
      next:     $(this.options.get('nextbutton')),
      reset:    $(this.options.get('resetbutton'))
    });
    
    // Look for custom fields:
    this.fields = $H({
      start:    $(this.options.get('startfield')),
      end:      $(this.options.get('endfield'))
    });
    
    this.format       = this.options.get('format');
    this.weekoffset   = this.options.get('weekoffset');
    this.weekdayNames = Date.weekdays; // this.weekdayNames = Date.internationalizations.get(this.options.get('locale'));
    this.monthNames   = Date.months;   // this.monthNames   = Date.internationalizations.get(this.options.get('locale'));
    this.date         = new Date();
    this.defaultDate  = new Date(this.date)
    
    this.buildButtons();
    this.calendars.times(function(calendar) { this.buildCalendar(calendar) }.bind(this));
    this.buildFields();
    this.populate();
    this.activate();
  },
  
  // Make sure dragging doesn't select any calendar text
  disableSelection: function(element) {
    element.onselectstart       = function() { return false; };
    element.unselectable        = 'on';
    element.style.MozUserSelect = 'none';
    element.style.cursor        = 'default';
  },
  
  buildButtons: function() {
    var list = new Element('ul', { id: 'timeframe_menu' });
    this.buttons.each(function(pair) {
      if(pair.value)
        pair.value.addClassName('timeframe_button').addClassName(pair.key);
      else {
        var item = new Element('li');
        this.buttons.set(pair.key, new Element('a', { className: 'timeframe_button ' + pair.key, href: '#', onclick: 'return false;' }).update(pair.key));
        Element.insert(item, { bottom: this.buttons.get(pair.key) });
        Element.insert(list, { bottom: item });
      }
    }.bind(this))
    if(list.childNodes.length > 0) Element.insert(this.container, { bottom: list });
    
    this.clearButton = new Element('span', { className: 'clear' }).update(new Element('span').update('X'));
  },
  
  buildCalendar: function(calendarNumber) {
    var calendar = new Element('table', { id: 'calendar_' + calendarNumber, border: 0, cellspacing: 0, cellpadding: 5 });
    Element.insert(calendar, { top: new Element('caption') });
    Element.insert(calendar, { bottom: this.buildHead() });
    Element.insert(calendar, { bottom: this.buildBody() });
    Element.insert(this.container, { bottom: calendar });
  },
  
  buildHead: function() {
    var head = new Element('thead');
    var row  = new Element('tr');
    this.weekdayNames.length.times(function(column) {
      var weekday = this.weekdayNames[(column + this.weekoffset) % 7];
      var cell = new Element('th', { scope: 'col', abbr: weekday }).update(weekday.substring(0,1));
      Element.insert(row, { bottom: cell });
    }.bind(this));
    Element.insert(head, { bottom: row });
    return head;
  },
  
  buildBody: function() {
    var body = new Element('tbody');
    (6).times(function(rowNumber) {
      var row = new Element('tr');
      this.weekdayNames.length.times(function(column) {
        var cell = new Element('td');
        Element.insert(row, { bottom: cell });
      });
      Element.insert(body, { bottom: row });
    }.bind(this));
    return body;
  },
  
  buildFields: function() {
    var fieldset = new Element('div', { id: 'timeframe_fields' });
    this.fields.each(function(pair) {
      if(pair.value)
        pair.value.addClassName('timeframe_field').addClassName(pair.key);
      else {
        var container = new Element('div', { id: pair.key + 'field_container' });
        this.fields.set(pair.key, new Element('input', { id: pair.key + 'field', name: pair.key + 'field', type: 'text', value: '' }));
        Element.insert(container, { bottom: new Element('label', { 'for': pair.key + 'field' }).update(pair.key) });
        Element.insert(container, { bottom: this.fields.get(pair.key) });
        Element.insert(fieldset, { bottom: container });
      }
    }.bind(this));
    if(fieldset.childNodes.length > 0) Element.insert(this.container, { bottom: fieldset });
    this.startfield = this.fields.get('start');
    this.endfield = this.fields.get('end');
  },
  
  populate: function() {
    var month = this.date.neutral();
    month.setDate(1);
    this.calendars.times(function(n) {
      var calendar = $('calendar_' + n);
      var caption = calendar.select('caption').first();
      caption.update(this.monthNames[month.getMonth()] + ' ' + month.getFullYear());
      
      var iterator = new Date(month);
      var offset = (iterator.getDay() - this.weekoffset) % 7;
      var inactive = offset > 0 ? 'pre' : false;
      iterator.setDate(iterator.getDate() - offset);
      if(iterator.getDate() > 1 && !inactive) {
        iterator.setDate(iterator.getDate() - 7);
        if(iterator.getDate() > 1) inactive = 'pre';
      }
      
      calendar.select('td').each(function(day) {
        day.date = new Date(iterator); // Is this expensive (we unload these later)? We could store the epoch time instead.
        day.update(day.date.getDate()).setAttribute('className', inactive || 'active');
        if(iterator.toString() === new Date().neutral().toString()) day.addClassName('today');
        iterator.setDate(iterator.getDate() + 1);
        if(iterator.getDate() == 1) inactive = inactive ? false : 'post';
      });
      
      month.setMonth(month.getMonth() + 1);
    }.bind(this));
    this.refreshRange();
  },
  
  activate: function() {
    document.observe('click', this.handleClick.bindAsEventListener(this));
    document.observe('mousedown', this.handleMousedown.bindAsEventListener(this));
    document.observe('mouseover', this.handleMouseover.bindAsEventListener(this));
    document.observe('mouseup', this.setPoint.bindAsEventListener(this));
    document.observe('unload', this.deactivate.bindAsEventListener(this));
    this.aimFieldObservers();
  },
  
  aimFieldObservers: function(field, assignment) {    
    [this.startfield, this.endfield].invoke('observe', 'focus', this.declareFocus.bindAsEventListener(this));
    [this.startfield, this.endfield].invoke('observe', 'blur', this.declareBlur.bindAsEventListener(this));
    new Form.Element.Observer(this.startfield, 0.2, function(element, value) {
      if(element.hasFocus) {
        var date = new Date(Date.parse(value)).neutral();
        this.startdate = date == 'Invalid Date' ? null : date;
        this.refreshRange();
      }
    }.bind(this));
    new Form.Element.Observer(this.endfield, 0.2, function(element, value) {
      if(element.hasFocus) {
        var date = new Date(Date.parse(value)).neutral();
        this.enddate = date == 'Invalid Date' ? null : date;
        this.refreshRange();
      }
    }.bind(this));
  },
  
  declareFocus: function(event) {
    event.element().hasFocus = true;
    if(this.startdate && event.element() == this.startfield) {
      this.date = new Date(this.startdate)
      this.populate();
    }
    else if(this.enddate && event.element() == this.endfield) {
      this.date = new Date(this.enddate)
      this.populate();
    }
  },
  
  declareBlur: function(event) {
    event.element().hasFocus = false;
    this.refreshFields();
  },
  
  deactivate: function() {
    this.container.select('td').each(function(day) { day.date = null; });
  },
  
  handleClick: function(event) {
    if(!event.element().ancestors) return;
    var el;
    if(el = event.findElement('a.timeframe_button'))
      this.handleButtonClick(event, el);
  },
  
  handleMousedown: function(event) {
    if(!event.element().ancestors) return;
    var el, em;
    if(el = event.findElement('span.clear')) {
      el.addClassName('active');
      if(em = event.findElement('td'))
        this.handleDateClick(em, true);
    }
    else if(el = event.findElement('td'))
      this.handleDateClick(el);
    else return;
  },
  
  handleButtonClick: function(event, element) {
    var el;
    var movement = this.calendars > 1 ? this.calendars - 1 : 1;
    if(element.hasClassName('next'))
      this.date.setMonth(this.date.getMonth() + movement);
    else if(element.hasClassName('previous'))
      this.date.setMonth(this.date.getMonth() - movement);
    else if(element.hasClassName('today'))
      this.date = new Date();
    else if(element.hasClassName('reset')) {
      this.resetFields();
    }
    this.populate();
  },
  
  resetFields: function() {
    this.startfield.value = this.startfield.defaultValue || '';
    this.endfield.value = this.endfield.defaultValue || '';
    this.date = new Date(this.defaultDate);
    var startdate = new Date(Date.parse(this.startfield.value)).neutral();
    this.startdate = startdate == 'Invalid Date' ? null : startdate;
    var enddate = new Date(Date.parse(this.endfield)).neutral();
    this.enddate = enddate == 'Invalid Date' ? null : enddate;
  },
  
  handleDateClick: function(element, couldClear) {
    this.mousedown = this.dragging = true;
    if(this.stuck)
      this.stuck = false;
    else if(couldClear) {
      if(!element.hasClassName('startrange')) return;
    }
    else {
      this.stuck = true;
      setTimeout(function() { if(this.mousedown) this.stuck = false; }.bind(this), 200);
    }
    this.getPoint(element.date);
  },
  
  getPoint: function(date) {
    if(this.startdate && this.startdate.toString() == date && this.enddate)
      this.startdrag = this.enddate;
    else {
      this.clearButton.hide();
      if(this.enddate && this.enddate.toString() == date)
        this.startdrag = this.startdate;
      else
        this.startdrag = this.startdate = this.enddate = date;
    }
    this.refreshRange();
  },
  
  handleMouseover: function(event) {
    var el;
    if(!this.dragging)
      this.toggleClearButton(event);
    else if(event.findElement('span.clear.active'));
    else if(el = event.findElement('td'))
      this.extendRange(el.date);
  },
  
  toggleClearButton: function(event) {
    var el;
    if(event.element().ancestors && event.findElement('td.selected')) {
      if(el = this.container.select('#calendar_0 .pre.selected').first());
      else if(el = this.container.select('.active.selected').first());
      if(el) Element.insert(el, { top: this.clearButton });
      this.clearButton.removeClassName('active').show();        
    }
    else {
      this.clearButton.hide();
    }
  },
  
  extendRange: function(date) {
    this.clearButton.hide();
    if(date > this.startdrag) {
      this.startdate = this.startdrag;
      this.enddate = date;
    }
    else if(date < this.startdrag) {
      this.startdate = date;
      this.enddate = this.startdrag;
    }
    else {
      this.startdate = this.enddate = date;
    }
    this.refreshRange();
  },
  
  setPoint: function(event) {
    if(!this.dragging) return;
    if(!this.stuck) {
      var el;
      this.dragging = false;
      if(el = event.findElement('span.clear.active')) {
        el.hide().removeClassName('active');
        this.startdate = this.enddate = null;
        this.refreshRange();
        this.refreshFields();
      }
    }
    this.mousedown = false;
    this.refreshRange();
  },
  
  refreshRange: function() {
    this.container.select('td').each(function(day) {
      if(this.startdate <= day.date && day.date <= this.enddate) {
        day.addClassName('selected');
        this.stuck || this.mousedown ? day.addClassName('stuck') : day.removeClassName('stuck');
        this.startdate.toString() == day.date ? day.addClassName('startrange') : day.removeClassName('startrange');
        this.enddate.toString() == day.date ? day.addClassName('endrange') : day.removeClassName('endrange');
      }
      else day.removeClassName('selected').removeClassName('startrange').removeClassName('endrange').removeClassName('stuck');
    }.bind(this));
    if(this.dragging) this.refreshFields();
  },
  
  refreshFields: function() {
    this.startfield.value = this.startdate ? this.startdate.strftime(this.format) : '';
    this.endfield.value = this.enddate ? this.enddate.strftime(this.format) : '';
  }
});

Object.extend(Date.prototype, {
  // modified from http://alternateidea.com/blog/articles/2008/2/8/a-strftime-for-prototype
  strftime: function(format) {
    var day = this.getDay(), month = this.getMonth();
    var hours = this.getHours(), minutes = this.getMinutes();
    function pad(num) { return num.toPaddedString(2); };
 
    return format.gsub(/\%([aAbBcdHImMpSwyY])/, function(part) {
      switch(part[1]) {
        case 'a': return Date.weekdays.invoke('substring', 0, 3)[day]; break;
        case 'A': return Date.weekdays[day]; break;
        case 'b': return Date.months.invoke('substring', 0, 3)[month]; break;
        case 'B': return Date.months[month]; break;
        case 'c': return this.toString(); break;
        case 'd': return pad(this.getDate()); break;
        case 'H': return pad(hours); break;
        case 'I': return (hours % 12 == 0) ? 12 : pad(hours % 12); break;
        case 'm': return pad(month + 1); break;
        case 'M': return pad(minutes); break;
        case 'p': return hours >= 12 ? 'PM' : 'AM'; break;
        case 'S': return pad(this.getSeconds()); break;
        case 'w': return day; break;
        case 'y': return pad(this.getFullYear() % 100); break;
        case 'Y': return this.getFullYear().toString(); break;
      }
    }.bind(this));
  },
  
  neutral: function() {
    var neutered = new Date(this);
    neutered.setHours(12);
    neutered.setMinutes(0);
    neutered.setSeconds(0);
    neutered.setMilliseconds(0);
    return neutered;
  }
});