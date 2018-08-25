import React from 'react';
import { Link } from 'react-router-dom';
export function genUserElt(user, text) {
  return (
    <Link
      to={{
        pathname: '/user',
        search: '?id=' + (user._id || user)
      }}
    >
      {text}
    </Link>
  );
}

export function getUrlParameter(search, name) {
  name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
export function precisionRoundDecimals(number, precision = 1) {
  var factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

export function precisionRoundWhole(number, precision = 1) {
  var factor = Math.pow(10, precision);
  return Math.round(number / factor) * factor;
}

export function millisToTime(t) {
  t = t / 60000;
  const ret = precisionRoundDecimals(t, 1);
  return ret > 999 ? '>999' : ret;
}

export function toDataArray(hash) {
  var t = [];

  for (var k in hash) {
    t.push({ x: parseInt(k), y: hash[k], date: new Date(parseInt(k, 10)) });
  }

  return t;
}

export function formatTime(date) {
  var months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  date = new Date(date);

  var t = new Date();
  var now = new Date(t.getTime() - t.getTimezoneOffset() * 60000);

  var then = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  if (now.getFullYear() !== then.getFullYear()) {
    return months[then.getMonth()] + ' ' + then.getDate() + ', ' + then.getFullYear();
  }

  var diff = now - then;

  var seconds = parseInt(diff / 1000, 10);
  var minutes = parseInt(seconds / 60, 10);
  var hours = parseInt(minutes / 60, 10);
  var days = parseInt(hours / 24, 10);

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

export function filterXSS(unescaped) {
  return unescaped.toString().replace(/[\W_]+/g, '');
}

export function getCourse(props) {
  const matches = props.location.pathname.match(/^\/(\w+)\/.*/);

  return !!matches && matches.length >= 2 ? filterXSS(matches[1]) : null;
}

export function getCourseId() {
  return localStorage.getItem('courseId');
}

export function isString(maybeStr) {
  return typeof maybeStr === 'string' || maybeStr instanceof String;
}

function removeFromArray(arr) {
  var what,
    a = arguments,
    L = a.length,
    ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax = arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
}

export function roleForUser(user, course) {
  const { _id: courseDbId } = course;
  const privs = user && user.roles && user.roles.filter(role => role.course === courseDbId);
  return privs && privs.length > 0 && privs[0];
}

// this is dumb
export function roleForUserDbId(user, courseDbId) {
  const privs = user && user.roles && user.roles.filter(role => role.course === courseDbId);
  return privs && privs.length > 0 && privs[0];
}

export function privForUser(user, courseDbId) {
  const role = roleForUser(user, courseDbId);
  return role && role.privilege;
}

// course is string course._id
export function storeRecentCourse(course) {
  let recentCourses = getRecentCourses();
  removeFromArray(recentCourses, course);
  recentCourses.push(course);
  localStorage.setItem('recentCourses', JSON.stringify(recentCourses));
  return recentCourses;
}

export function getRecentCourses() {
  let recentCourses = localStorage.getItem('recentCourses');
  if (!isString(recentCourses)) {
    return [];
  }
  return JSON.parse(recentCourses) || [];
}

export function courseForId(allCourses, courseDbId) {
  for (let i = 0; i < allCourses.length; i++) {
    const course = allCourses[i];
    if (course._id === courseDbId) {
      return course;
    }
  }
  return null;
}

export function idForSoftCourseId(allCourses, courseid) {
  if (!isString(courseid)) {
    return null;
  }
  for (let i = 0; i < allCourses.length; i++) {
    const course = allCourses[i];
    if (course.courseid.toLowerCase() === courseid.toLowerCase()) {
      return course;
    }
  }
  return null;
}

export function hasAppPermission(user, permission) {
  return user && user.permissions && user.permissions.includes(permission);
}

export function hasCoursePermission(user, course, permission) {
  return (
    user &&
    user.roles &&
    roleForUser(user, course) &&
    roleForUser(user, course).privilege.toLowerCase() === permission.toLowerCase()
  );
}

export function isInstructor(user, course) {
  return hasCoursePermission(user, course, 'Instructor')
}

export function isInstructorOrTa(user, course) {
  return hasCoursePermission(user, course, 'Instructor') || hasCoursePermission(user, course, 'TA')
}

export function routeForUser(user, course) {
  const priv = privForUser(user, course);
  let roleUrl;
  // TODO: error case?
  switch (priv) {
    case 'Admin':
    case 'Instructor':
      roleUrl = 'instructor';
      break;
    case 'TA':
      roleUrl = 'ta';
      break;
    case 'Student':
    default:
      roleUrl = 'student';
  }

  // admins can do what they want
  if (user.permissions.includes('admin')) {
    roleUrl = 'instructor';
  }

  return `/${course.courseid}/${roleUrl}`;
}
