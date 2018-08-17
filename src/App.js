import React from 'react';
import { BrowserRouter as Router, Route, Link, Redirect, withRouter } from 'react-router-dom';
import Ta from './components/Ta';
import Student from './components/Student';
import Login from './components/Login';
import Instructor from './components/Instructor';
import TicketHistory from './components/TicketHistory';
import UserDetails from './components/UserDetails';
//import ManageCourses from './components/ManageCourses';
import CreateCourseWizard from './components/CreateCourseWizard';
import ListCourses from './components/ListCourses';
import AdminUsers from './components/AdminUsers';
import { getCourse, isString, getRecentCourses, storeRecentCourse } from './Utils';

import { defaultContext, UserContext, withUser, withUserRequireCourse } from './api/UserStore';

const io = require('socket.io-client');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const auth = require('@feathersjs/authentication-client');

const ConnectedLogin = withUser(Login);

class App extends React.Component {
  setCourse = course => {
    if (course && isString(course.courseid) && isString(course._id)) {
      localStorage.setItem('lastCourse', course);
      if (this.state.allCourses) {
        const recentCourseIds = storeRecentCourse(course._id);
        const recentCourses = this.state.allCourses.filter(course => recentCourseIds.includes(course._id));
        this.setState({ course, recentCourses });
      } else {
        this.setState({ course });
      }
    } else {
      localStorage.removeItem('lastCourse');
      this.setState({ course: null });
    }
  };

  // TODO: call when exiting to a container without course required
  popCourse = () => {
    const { course } = this.state;
    if (course && isString(course.courseid) && isString(course._id)) {
      localStorage.setItem('lastCourse', course);
    }
    this.setState({ course: null });
  };

  logout = () => {
    const { client } = this.state;
    client
      .logout()
      .then(() => {
        // TODO: this will do for now but should eventually handle global user state a better way
        window.location.reload();
      })
      .catch(err => console.error);
  };

  constructor(props) {
    super(props);

    const socket = io('http://localhost:3030', {
      secure: true,
      transports: ['websocket'],
      forceNew: true
    });
    const client = feathers()
      .configure(socketio(socket))
      .configure(
        auth({
          cookie: 'feathers-jwt'
        })
      );
    client.set('socket', socket);

    this.state = Object.assign(defaultContext, { client, setCourse: this.setCourse, logout: this.logout });

    const users = client.service('/users');
    const courses = client.service('/courses');
    let queriedUser;
    // Try to authenticate with the JWT stored in localStorage
    client
      .authenticate()
      .then(response => {
        console.info('authenticated successfully');
        client.set('jwt', response.accessToken);
        return client.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        console.info('verified JWT');
        return users.get(payload.userId);
      })
      .then(user => {
        client.set('user', user);
        // TODO: phase out this garbage global call
        client.emit('authWithUser', user);
        const course = localStorage.getItem('lastCourse');
        if (course) {
          this.setCourse(course);
        }
        queriedUser = user;
        return courses.find();
        //this.setState({ user, recentCourses, authenticated: true });
      })
      .then(courses => {
        const recentCourseIds = getRecentCourses();
        const recentCourses = courses.data.filter(course => recentCourseIds.includes(course._id));
        this.setState({ user: queriedUser, recentCourses, allCourses: courses.data, authenticated: true });
      })
      .catch(err => {
        if (err.name === 'NotAuthenticated') {
          this.setState({ user: null, authenticated: false });
        } else {
          console.error('Error on feathers auth:', err);
        }
      });

    client.on('reauthentication-error', err => {
      console.error('Reauth error', err);
      this.setState({ user: null, authenticated: false });
    });
  }

  render() {
    return (
      <Router>
        {/* Bind the user context provider to the app's state */}
        <UserContext.Provider value={this.state}>
          <React.Fragment>
            <RoutedNav />
            <div id="main" className="container login-container">
              {this.state.authenticated === true ? (
                <React.Fragment>
                  <ConnectedRoute exact path="/" component={Login} />
                  <ConnectedRoute exact path="/courses" forRoles={['Instructor']} component={ListCourses} />
                  <ConnectedRoute path="/create_course" forRoles={['Instructor']} component={CreateCourseWizard} />
                  <ConnectedRoute path="/admin_users" forRoles={['Instructor']} component={AdminUsers} />
                  <ConnectedRoute path="/login" component={Login} />
                  <ConnectedRouteRequireCourse
                    path="/:course/instructor/"
                    forRoles={['Instructor']}
                    component={Instructor}
                  />
                  <ConnectedRouteRequireCourse path="/:course/ta" forRoles={['Instructor', 'TA']} component={Ta} />
                  <ConnectedRouteRequireCourse path="/:course/student" forRoles={['Student']} component={Student} />
                  <ConnectedRouteRequireCourse
                    path="/:course/tickets"
                    forRoles={['Instructor', 'TA']}
                    component={TicketHistory}
                  />
                  <ConnectedRoute path="/user" forRoles={['Instructor', 'TA']} component={UserDetails} />
                </React.Fragment>
              ) : (
                <ConnectedLogin />
              )}
            </div>
          </React.Fragment>
        </UserContext.Provider>
      </Router>
    );
  }
}

// Connect passed component to the main context and wrap in a Route
const ConnectedRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props => {
      const ConnectedComponent = withUser(Component);
      return <ConnectedComponent {...props} />;
    }}
  />
);

// Same behavior as ConnectedRoute require a course to be selected
const ConnectedRouteRequireCourse = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props => {
      const ConnectedComponent = withUserRequireCourse(Component);
      return <ConnectedComponent {...props} />;
    }}
  />
);

class Nav extends React.Component {
  genLink = (path, name) => {
    const { course } = this.props;

    return (
      course &&
      course.courseid && (
        <li>
          <Link to={`/${course.courseid}/${path}`}>{name}</Link>
        </li>
      )
    );
  };

  // TODO: <li className="active"> <span className="sr-only">(current)</span>
  render() {
    const course = this.props.course && this.props.course.courseid;
    const { user, recentCourses } = this.props;
    const roles = user && [user.role];

    return (
      <nav className="navbar">
        <div className="container-fluid">
          <div className="navbar-header">
            <button
              type="button"
              className="navbar-toggle collapsed"
              data-toggle="collapse"
              data-target="#bs-example-navbar-collapse-1"
              aria-expanded="false"
            >
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>
            <a className="navbar-brand dropdown-toggle" data-toggle="dropdown" href="#">
              {((course && course.toUpperCase()) || '') + ' Office Hours'}
              <span className="caret" />
            </a>
            <ul className="dropdown-menu" style={{ marginLeft: '25px' }}>
              {recentCourses && (
                <React.Fragment>
                  <li>
                    <a>Recent courses:</a>
                  </li>
                  {recentCourses.map(
                    course =>
                      course && (
                        <li key={course._id + '_list'}>
                          {/* TODO set function on select*/}
                          <a key={course._id} href="#">
                            {course.courseid}
                          </a>
                        </li>
                      )
                  )}
                  <li role="separator" className="divider" />
                </React.Fragment>
              )}
              <li>
                <Link to="/courses">All courses</Link>
              </li>
              {/*should we put a "manage course" dupe link to instr dashboard?*/}
              <li>
                <Link to="/admin_users">Manage users</Link>
              </li>
              <li role="separator" className="divider" />
              <li>
                <Link to="/create_course">+ New Course</Link>
              </li>
            </ul>
          </div>
          <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul className="nav navbar-nav">
              {course && roles.includes('Instructor') && this.genLink('instructor', 'Instructor Home')}
              {course && (roles.includes('Instructor') || roles.includes('TA')) && this.genLink('ta', 'TA Home')}
              {course &&
                (roles.includes('Instructor') || roles.includes('TA')) &&
                this.genLink('tickets', 'Ticket History')}
              {course && roles.includes('Student') && this.genLink('students', 'Home')}
              {!course && (
                <li>
                  <Link to="/courses">Select a course</Link>
                </li>
              )}
              <li>
                <a className="oh-sched-link" href="#">
                  OH Schedule
                </a>
              </li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
              {user && (
                <li>
                  <a href="#" onClick={this.props.logout}>
                    Logout
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>
    );
  }
}

const RoutedNav = withUser(withRouter(Nav));

export default App;
