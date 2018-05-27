import React from 'react';
import { Link } from 'react-router-dom';
export function genUserElt(user, text) {
  return <Link to={{
    pathname: '/user',
      search: '?id='+(user._id || user)
  }}>{text}</Link>;
};

export function  getUrlParameter(search, name) {
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};
export function  precisionRoundDecimals(number, precision = 1) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
};

export function  precisionRoundWhole(number, precision = 1) {
  var factor = Math.pow(10, precision);
  return Math.round(number / factor) * factor;
};

export function  millisToTime(t) {
  t = t / 60000;
  const ret = precisionRoundDecimals(t, 1);
  return ret > 999 ? ">999" : ret;
};

export function toDataArray(hash) {
  var t = [];

  for (var k in hash) {
    t.push({x: parseInt(k), y: hash[k], date: new Date(parseInt(k))});
  }

  return t;
}

export function formatTime(date) {
  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  date = new Date(date);

  var t = new Date();
  var now = new Date(t.getTime() - t.getTimezoneOffset() * 60000);

  var then = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  if (now.getFullYear() !== then.getFullYear()) {
    return months[then.getMonth()] + ' ' + then.getDate() + ', ' + then.getFullYear();
  }

  var diff = now - then;

  var seconds = parseInt(diff / 1000);
  var minutes = parseInt(seconds / 60);
  var hours = parseInt(minutes / 60);
  var days = parseInt(hours / 24);

  if (seconds < 60) {
    return seconds + ' second' + (seconds === 1 ? '' : 's') + ' ago';
  } else if (minutes < 60) {
    return minutes + ' minute' + (minutes === 1 ? '' : 's') + ' ago';
  } else if (hours < 24) {
    return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';
  } else if (days < 7) {
    return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  } else if (days === 7) {
    return 'One week ago';
  } else {
    return months[then.getMonth()] + ' ' + then.getDate();
  }
}
