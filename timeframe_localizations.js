// TODO: use Date.js for localizations
var Localizations = $H({
  ES: $H({
    format:     '%d %b %Y',
    months:     $w('enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'),
    weekdays:   $w('domingo lunes martes miércoles jueves viernes sábado'),
    weekOffset: 1
  }),
  FR: $H({
    format:     '%d %b %Y',
    months:     $w('janvier février mars avril mai juin juillet août septembre octobre novembre décembre'),
    weekdays:   $w('dimanche lundi mardi mercredi jeudi vendredi samedi'),
    weekOffset: 1
  }),
  IT: $H({
    format:     '%d %b %Y',
    months:     $w('gennaio febbraio marzo aprile maggio guigno luglio agosto settembre ottobre novembre dicembre'),
    weekdays:   $w('domenica lunedì martedì mercoledì giovedì venerdì sabato'),
    weekOffset: 1
  }),
  NL: $H({
    format:     '%d %b %Y',
    months:     $w('januari februari maart april mei juni juli augustus september oktober november december'),
    weekdays:   $w('zondag maandag dinsdag woensdag donderdag vrijdag zaterdag'),
    weekOffset: 1
  }),
  PT: $H({
    format:     '%d %b %Y',
    months:     $w('janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'),
    weekdays:   $w('domingo segunda terça quarta quinta sexta sábado'),
    weekOffset: 1
  }),
  UK: $H({
    format:     '%d %b %Y',
    months:     $w('January February March April May June July August September October November December'),
    weekdays:   $w('Sunday Monday Tuesday Wednesday Thursday Friday Saturday'),
    weekOffset: 1
  }),
  US: $H({
    format:     '%b %d, %Y',
    months:     $w('January February March April May June July August September October November December'),
    weekdays:   $w('Sunday Monday Tuesday Wednesday Thursday Friday Saturday'),
    weekOffset: 0
  })
});