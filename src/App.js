import React from 'react';
import toastr from 'toastr';
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
import Configure from './components/Configure';
import {
  getCourse,
  isString,
  getRecentCourses,
  storeRecentCourse,
  routeForUser,
  hasAppPermission,
  hasCoursePermission,
  isInstructor,
  isInstructorOrTa
} from './Utils';

import { defaultContext, UserContext, withUser, withUserRequireCourse, __API } from './api/UserStore';

const io = require('socket.io-client');
const feathers = require('@feathersjs/client');
const { socketio } = feathers;
const { authentication: auth } = feathers;

const ConnectedLogin = withUser(Login);

class App extends React.Component {
  setCourse = (course, serviceUpdate) => {
    if (!this.state.client) {
      return;
    }
    if (course && isString(course.courseid) && isString(course._id)) {
      localStorage.setItem('lastCourse', course);
      if (!this.state.course || this.state.course._id != course._id) {
        toastr.info(`Welcome to ${course.courseid} office hours by Quuly.`, null, { timeOut: 2500 });
      }
      const socket = this.state.client.get('socket');
      socket.emit('join course', course._id);
      this.state.client.emit('join course');
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

    // refresh allCourses in case course was modified or deleted
    if (this.state.client && serviceUpdate) {
      this.state.client
        .service('/courses')
        .find()
        .then(courses => {
          const recentCourseIds = getRecentCourses();
          const recentCourses = courses.data.filter(course => recentCourseIds.includes(course._id));
          this.setState({ recentCourses, allCourses: courses.data });
        })
        .catch(err => {
          toastr.error('Could not refresh courses, please check your internet connection and refresh');
          console.error(err);
        });
    }
  };

  popCourse = () => {
    const { course } = this.state;
    if (course && isString(course.courseid) && isString(course._id)) {
      localStorage.setItem('lastCourse', course);
    }
    if (course) {
      this.setState({ course: null });
    }
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

    const socket = io(__API, {
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

    window.client = client;

    this.state = Object.assign(defaultContext, {
      client,
      setCourse: this.setCourse,
      logout: this.logout,
      popCourse: this.popCourse
    });

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
          //toastr.error('Could not refresh courses, please check your internet connection and refresh');
        }
      });

    client.on('reauthentication-error', err => {
      console.error('Reauth error', err);
      this.setState({ user: null, authenticated: false });
    });
  }

  render() {
    // TODO: look into refactoring with https://github.com/ReactTraining/react-router/blob/v3/docs/API.md#named-components
    return (
      <Router>
        {/* Bind the user context provider to the app's state */}
        <UserContext.Provider value={this.state}>
          <React.Fragment>
            <RoutedNav />
            <div id="main" className="container login-container">
              {this.state.authenticated === false && <Route exact path="/configure" component={Configure} />}
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
            {
              <React.Fragment>
                <Route path="/:course/ta" component={Footer} />
                <Route path="/:course/student" component={Footer} />
                <Route path="/:course/courses" component={Footer} />
              </React.Fragment>
              // Hide for now <Footer />
            }
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
    const { course } = this.props;
    const { user, recentCourses } = this.props;
    const courseId = course && course.courseid;
    let ohURL;
    if (course && course.ohURL && course.ohURL !== '') {
      ohURL = course.ohURL;
    }

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
              {(courseId && `${courseId.toUpperCase()} Office hours`) || 'Quuly'}
              {user ? <span className="caret" /> : null}
            </a>
            {user ? (
              <ul className="dropdown-menu" style={{ marginLeft: '25px' }}>
                {recentCourses && (
                  <React.Fragment>
                    <li>
                      <a>Recent courses</a>
                    </li>
                    <li role="separator" className="divider" />
                    {recentCourses
                      ? recentCourses.map(
                          course =>
                            course ? (
                              <li key={course._id + '_list'}>
                                <Link
                                  key={'nav_' + course._id}
                                  to={routeForUser(user, course)}
                                  onClick={() => {
                                    this.props.setCourse(course);
                                  }}
                                >
                                  {course.courseid}
                                </Link>
                              </li>
                            ) : null
                        )
                      : null}
                  </React.Fragment>
                )}
                <li role="separator" className="divider" />
                <li>
                  <Link to="/courses">All courses</Link>
                </li>
                {hasAppPermission(user, 'admin') || hasAppPermission(user, 'user_mod') ? (
                  <li>
                    <Link to="/admin_users">Manage users</Link>
                  </li>
                ) : null}
                {hasAppPermission(user, 'admin') || hasAppPermission(user, 'course_create') ? (
                  <React.Fragment>
                    <li role="separator" className="divider" />
                    <li>
                      <Link to="/create_course">+ New Course</Link>
                    </li>
                  </React.Fragment>
                ) : null}
              </ul>
            ) : null}
          </div>
          <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul className="nav navbar-nav">
              {course &&
                (hasAppPermission(user, 'admin') || isInstructor(user, course)) &&
                this.genLink('instructor', 'Instructor Home')}
              {course &&
                (hasAppPermission(user, 'admin') || isInstructorOrTa(user, course)) &&
                this.genLink('ta', 'TA Home')}
              {course &&
                (hasAppPermission(user, 'admin') || hasAppPermission(user, 'user_view')) &&
                this.genLink('tickets', 'Course Ticket History')}
              {course && hasCoursePermission(course, user, 'Student') && this.genLink('students', 'Home')}
              {!course &&
                user && (
                  <li>
                    <Link to="/courses">Select a course</Link>
                  </li>
                )}
              {ohURL && (
                <li>
                  <a className="oh-sched-link" href={ohURL}>
                    OH Schedule
                  </a>
                </li>
              )}
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

const Footer = () => (
  <footer
    className={'footer'}
    style={{
      position: 'fixed',
      width: '100%',
      height: '30px',
      lineHeight: '30px',
      bottom: 0,
      display: 'block',
      backgroundColor: '#ebebeb',
      marginTop: '10px',
      textAlign: 'center',
      opacity: 0.8
    }}
  >
    <div className="container">
      <p style={{ color: '#990000' }}>Powered by Quuly.com</p>
    </div>
  </footer>
);

export default App;
