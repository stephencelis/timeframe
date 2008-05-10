/* Timeframe, version 0.2
 * (c) 2008 Stephen Celis
 *
 * Freely distributable under the terms of an MIT-style license. 
 * ------------------------------------------------------------- */

if(typeof Prototype == 'undefined' || parseFloat(Prototype.Version.substring(0, 3)) < 1.6)
  throw 'Timeframe requires Prototype version 1.6 or greater.';

// Checks for localized Datejs before defaulting to 'en-US'
var Locale = $H({
  format:     (typeof Date.CultureInfo == 'undefined' ? '%b %d, %Y' : Date.CultureInfo.formatPatterns.shortDate),
  monthNames: (typeof Date.CultureInfo == 'undefined' ? $w('January February March April May June July August September October November December') : Date.CultureInfo.monthNames),
  dayNames:   (typeof Date.CultureInfo == 'undefined' ? $w('Sunday Monday Tuesday Wednesday Thursday Friday Saturday') : Date.CultureInfo.dayNames),
  weekOffset: (typeof Date.CultureInfo == 'undefined' ? 0 : Date.CultureInfo.firstDayOfWeek)
});

var Timeframes = [];

var Timeframe = Class.create({
  Version: '0.2',
  
  initialize: function(element, options) {
    Timeframes.push(this);
    
    this.element = $(element);
    this.options = $H({ months: 2 }).merge(options || {});;
    this.months = this.options.get('months');
    
    this.weekdayNames = Locale.get('dayNames');
    this.monthNames   = Locale.get('monthNames');
    this.format       = this.options.get('format')     || Locale.get('format');
    this.weekOffset   = this.options.get('weekOffset') || Locale.get('weekOffset');
    
    this.buttons = $H({
      previous: $H({ label: '&larr;', element: $(this.options.get('previousButton')) }),
      today:    $H({ label: 'T',      element: $(this.options.get('todayButton')) }),
      reset:    $H({ label: 'R',      element: $(this.options.get('resetButton')) }),
      next:     $H({ label: '&rarr;', element: $(this.options.get('nextButton')) })
    })
    this.fields = $H({ start: $(this.options.get('startField')), end: $(this.options.get('endField')) });
    
    this.range = $H({});
    this._buildButtons()._buildFields();
    this.earliest = Date.parseToObject(this.options.get('earliest'));
    this.latest   = Date.parseToObject(this.options.get('latest'));
    
    this.calendars = [];    
    this.element.insert(new Element('div', { id: 'calendars_container' }));
    this.months.times(function(month) { this.createCalendar(month) }.bind(this));
    
    this.register().populate().refreshRange();
  },
  
  // Scaffolding
  
  createCalendar: function() {
    var calendar = new Element('table', { id: 'calendar_' + this.calendars.length, border: 0, cellspacing: 0, cellpadding: 5 });
    calendar.insert(new Element('caption'));
    
    var head = new Element('thead');
    var row  = new Element('tr');
    this.weekdayNames.length.times(function(column) {
      var weekday = this.weekdayNames[(column + this.weekOffset) % 7];
      var cell = new Element('th', { scope: 'col', abbr: weekday }).update(weekday.substring(0,1));
      row.insert(cell);
    }.bind(this));
    head.insert(row);
    calendar.insert(head);
    
    var body = new Element('tbody');
    (6).times(function(rowNumber) {
      var row = new Element('tr');
      this.weekdayNames.length.times(function(column) {
        var cell = new Element('td');
        row.insert(cell);
      });
      body.insert(row);
    }.bind(this));
    calendar.insert(body);
    
    this.element.down('div#calendars_container').insert(calendar);
    this.calendars.push(calendar);
    this.months = this.calendars.length;
    return this;
  },
  
  destroyCalendar: function() {
    this.calendars.pop().remove();
    this.months = this.calendars.length;
    return this;
  },
  
  populate: function() {
    var month = this.date.neutral();
    month.setDate(1);
    this.months.times(function(n) {      
      var calendar = $('calendar_' + n);
      var caption = calendar.select('caption').first();
      caption.update(this.monthNames[month.getMonth()] + ' ' + month.getFullYear());
      
      var iterator = new Date(month);
      var offset = (iterator.getDay() - this.weekOffset) % 7;
      var inactive = offset > 0 ? 'pre beyond' : false;
      iterator.setDate(iterator.getDate() - offset);
      if(iterator.getDate() > 1 && !inactive) {
        iterator.setDate(iterator.getDate() - 7);
        if(iterator.getDate() > 1) inactive = 'pre beyond';
      }
      
      calendar.select('td').each(function(day) {
        day.date = new Date(iterator); // Is this expensive (we unload these later)? We could store the epoch time instead.
        day.update(day.date.getDate()).writeAttribute('class', inactive || 'active');
        if((this.earliest && day.date < this.earliest) || (this.latest && day.date > this.latest))
          day.addClassName('unselectable');
        else
          day.addClassName('selectable');
        if(iterator.toString() === new Date().neutral().toString()) day.addClassName('today');
        day.baseClass = day.readAttribute('class');
        
        iterator.setDate(iterator.getDate() + 1);
        if(iterator.getDate() == 1) inactive = inactive ? false : 'post beyond';
      }.bind(this));
      
      month.setMonth(month.getMonth() + 1);
    }.bind(this));
    return this;
  },
  
  _buildButtons: function() {
    var buttonList = new Element('ul', { id: 'timeframe_menu' });
    this.buttons.each(function(pair) {
      if(pair.value.get('element'))
        pair.value.get('element').addClassName('timeframe_button').addClassName(pair.key);
      else {
        var item = new Element('li');
        var button = new Element('a', { className: 'timeframe_button ' + pair.key, href: '#', onclick: 'return false;' }).update(pair.value.get('label'));
        button.onclick = function() { return false; };
        pair.value.set('element', button);
        item.insert(button);
        buttonList.insert(item);
      }
    }.bind(this))
    if(buttonList.childNodes.length > 0) this.element.insert({ top: buttonList });
    this.clearButton = new Element('span', { className: 'clear' }).update(new Element('span').update('X'));
    return this;
  },
  
  _buildFields: function() {
    var fieldset = new Element('div', { id: 'timeframe_fields' });
    this.fields.each(function(pair) {
      if(pair.value)
        pair.value.addClassName('timeframe_field').addClassName(pair.key);
      else {
        var container = new Element('div', { id: pair.key + 'field_container' });
        this.fields.set(pair.key, new Element('input', { id: pair.key + 'field', name: pair.key + 'field', type: 'text', value: '' }));
        container.insert(new Element('label', { 'for': pair.key + 'field' }).update(pair.key));
        container.insert(this.fields.get(pair.key));
        fieldset.insert(container);
      }
    }.bind(this));
    if(fieldset.childNodes.length > 0) this.element.insert(fieldset);
    this.parseField('start').refreshField('start').parseField('end').refreshField('end').initDate = new Date(this.date);
    return this;
  },
  
  // Event registration
  
  register: function() {
    document.observe('click', this.eventClick.bind(this));
    document.observe('mousedown', this.eventMouseDown.bind(this));
    document.observe('mouseover', this.eventMouseOver.bind(this));
    document.observe('mouseup', this.eventMouseUp.bind(this));
    document.observe('unload', this.unregister.bind(this));
    if(Prototype.Browser.Opera) document.observe('mousemove', this.handleMousemove.bind(this));
    return this._registerFieldObserver('start')._registerFieldObserver('end')._disableTextSelection();
  },
  
  unregister: function() {
    this.element.select('td').each(function(day) { day.date = day.baseClass = null; });
  },
  
  _registerFieldObserver: function(fieldName) {
    var field = this.fields.get(fieldName);
    field.observe('focus', function() { field.hasFocus = true; this.parseField(fieldName, true); }.bind(this));
    field.observe('blur', function() { this.refreshField(fieldName); }.bind(this));
    new Form.Element.Observer(field, 0.2, function(element, value) { if(element.hasFocus) this.parseField(fieldName, true); }.bind(this));
    return this;
  },
  
  _disableTextSelection: function() {
    this.element.onselectstart       = function() { return false; };
    this.element.unselectable        = 'on';
    this.element.style.MozUserSelect = 'none';
    this.element.style.cursor        = 'default';
    return this;
  },
  
  // Fields
  
  parseField: function(fieldName, populate) {
    var field = this.fields.get(fieldName);
    var date = Date.parseToObject(this.fields.get(fieldName).value);
    var failure = this.validateField(fieldName, date);
    if(failure != 'hard') {
      this.range.set(fieldName, date);
      field.removeClassName('error');
    } else if(field.hasFocus)
      field.addClassName('error');
    var date = Date.parseToObject(this.range.get(fieldName));
    this.date = date || new Date();
    if(populate && date) this.populate()
    this.refreshRange();
    return this;
  },
  
  refreshField: function(fieldName) {
    var field = this.fields.get(fieldName);
    var initValue = field.value;
    if(this.range.get(fieldName)) {
      field.value = typeof Date.CultureInfo == 'undefined' ? this.range.get(fieldName).strftime(this.format) : this.range.get(fieldName).toString(this.format);
    } else
      field.value = '';
    field.hasFocus && field.value == '' && initValue != '' ? field.addClassName('error') : field.removeClassName('error');
    field.hasFocus = false;
    return this;
  },
  
  validateField: function(fieldName, date) {
    var error;
    if((this.earliest && date < this.earliest) || (this.latest && date > this.latest))
      error = 'hard';
    else if(fieldName == 'start' && this.range.get('end') && date > this.range.get('end'))
      error = 'soft';
    else if(fieldName == 'end' && this.range.get('start') && date < this.range.get('start'))
      error = 'soft';
    return error;
  },
  
  // Event handling
  
  eventClick: function(event) {
    if(!event.element().ancestors) return;
    var el;
    if(el = event.findElement('a.timeframe_button'))
      this.handleButtonClick(event, el);
  },
  
  eventMouseDown: function(event) {
    if(!event.element().ancestors) return;
    var el, em;
    if(el = event.findElement('span.clear')) {
      el.down('span').addClassName('active');
      if(em = event.findElement('td.selectable'))
        this.handleDateClick(em, true);
    } else if(el = event.findElement('td.selectable'))
      this.handleDateClick(el);
    else return;
  },
  
  handleButtonClick: function(event, element) {
    var el;
    var movement = this.months > 1 ? this.months - 1 : 1;
    if(element.hasClassName('next'))
      this.date.setMonth(this.date.getMonth() + movement);
    else if(element.hasClassName('previous'))
      this.date.setMonth(this.date.getMonth() - movement);
    else if(element.hasClassName('today'))
      this.date = new Date();
    else if(element.hasClassName('reset'))
      this.reset();
    this.populate().refreshRange();
  },
  
  reset: function() {
    this.fields.get('start').value = this.fields.get('start').defaultValue || '';
    this.fields.get('end').value   = this.fields.get('end').defaultValue   || '';
    this.date = new Date(this.initDate);
    this.parseField('start').parseField('end');
  },
  
  handleDateClick: function(element, couldClear) {
    this.mousedown = this.dragging = true;
    if(this.stuck)
      this.stuck = false;
    else if(couldClear) {
      if(!element.hasClassName('startrange')) return;
    } else {
      this.stuck = true;
      setTimeout(function() { if(this.mousedown) this.stuck = false; }.bind(this), 200);
    }
    this.getPoint(element.date);
  },
  
  getPoint: function(date) {
    if(this.range.get('start') && this.range.get('start').toString() == date && this.range.get('end'))
      this.startdrag = this.range.get('end');
    else {
      this.clearButton.hide();
      if(this.range.get('end') && this.range.get('end').toString() == date)
        this.startdrag = this.range.get('start');
      else
        this.startdrag = this.range.set('start', this.range.set('end', date));
    }
    this.refreshRange();
  },
  
  eventMouseOver: function(event) {
    var el;
    if(!this.dragging)
      this.toggleClearButton(event);
    else if(event.findElement('span.clear span.active'));
    else if(el = event.findElement('td.selectable'))
      this.extendRange(el.date);
    else this.toggleClearButton(event);
  },
  
  toggleClearButton: function(event) {
    var el;
    if(event.element().ancestors && event.findElement('td.selected')) {
      if(el = this.element.select('#calendar_0 .pre.selected').first());
      else if(el = this.element.select('.active.selected').first());
      if(el) Element.insert(el, { top: this.clearButton });
      this.clearButton.show().down('span').removeClassName('active');        
    } else {
      this.clearButton.hide();
    }
  },
  
  extendRange: function(date) {
    this.clearButton.hide();
    if(date > this.startdrag) {
      this.range.set('start', this.startdrag);
      this.range.set('end', date);
    } else if(date < this.startdrag) {
      this.range.set('start', date);
      this.range.set('end', this.startdrag);
    } else {
      this.range.set('start', this.range.set('end', date));
    }
    this.refreshRange();
  },
  
  eventMouseUp: function(event) {
    if(!this.dragging) return;
    if(!this.stuck) {
      var el;
      this.dragging = false;
      if(el = event.findElement('span.clear span.active')) {
        el.removeClassName('active').up('span').hide();
        this.range.set('start', this.range.set('end', null));
        this.refreshField('start').refreshField('end');
      }
    }
    this.mousedown = false;
    this.refreshRange();
  },
  
  refreshRange: function() {
    this.element.select('td').each(function(day) {
      day.writeAttribute('class', day.baseClass);
      if(this.range.get('start') <= day.date && day.date <= this.range.get('end')) {
        var baseClass = day.hasClassName('beyond') ? 'beyond_' : day.hasClassName('today') ? 'today_' : null;
        var state = this.stuck || this.mousedown ? 'stuck' : 'selected';
        if(baseClass) day.addClassName(baseClass + state);
        day.addClassName(state);
        var rangeClass = '';
        if(this.range.get('start').toString() == day.date) rangeClass += 'start';
        if(this.range.get('end').toString() == day.date) rangeClass += 'end';
        if(rangeClass.length > 0) day.addClassName(rangeClass + 'range');
      }
      if(Prototype.Browser.Opera) {
        day.unselectable = 'on'; // Trick Opera into refreshing the selection (FIXME)
        day.unselectable = null;
      }
    }.bind(this));
    if(this.dragging) this.refreshField('start').refreshField('end');
  },

  handleMousemove: function(event) {
    if(event.findElement('#' + this.element.id + ' td')) window.getSelection().removeAllRanges(); // More Opera trickery
  }
});

Object.extend(Date, {
  parseToObject: function(string) {
    var date = Date.parse(string);
    if(!date) return null;
    date = new Date(date);
    return (date == 'Invalid Date' || date == 'NaN') ? null : date.neutral();
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
        case 'a': return Locale.get('dayNames').invoke('substring', 0, 3)[day].escapeHTML(); break;
        case 'A': return Locale.get('dayNames')[day].escapeHTML(); break;
        case 'b': return Locale.get('monthNames').invoke('substring', 0, 3)[month].escapeHTML(); break;
        case 'B': return Locale.get('monthNames')[month].escapeHTML(); break;
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
    return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 12);
  }
});
