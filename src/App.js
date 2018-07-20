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
import { getCourse } from './Utils';

const io = require('socket.io-client');
const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const auth = require('@feathersjs/authentication-client');

class App extends React.Component {

  constructor(props) {
    super(props);

    const socket = io('http://localhost:3030', {
      secure: true,
      transports: ['websocket'],
      forceNew: true
    });
    const client = feathers()
    //.configure(feathers.hooks())
    .configure(socketio(socket))
    .configure(auth({
      cookie: 'feathers-jwt',
    }));
    client.set('socket', socket);
    const users = client.service('/users');

    // Try to authenticate with the JWT stored in localStorage
    client.authenticate()
    .then(response => {
      console.info("authenticated successfully");
      client.set('jwt', response.accessToken)
      return client.passport.verifyJWT(response.accessToken);
    })
    .then(payload => {
      console.info("verified JWT");
      return users.get(payload.userId);
    })
    .then(user => {
      client.set('user', user);
      client.emit('authWithUser', user);
      this.setState({user, authenticated: true})
      client.on('reauthentication-error', () => {console.error("REAUTH ERROR!")});
    })
    .catch((err) => {
      if (err.name === 'NotAuthenticated') {
        this.setState({authenticated: false});
      }
      console.error(err);
    });
    this.state = {client};
  }

  componentDidMount() {

  }

  render() {
    return (
      <Router>
      <div>
        <RoutedNav client={this.state.client} />
        <div id="main" className="container login-container">
          {
            this.state.authenticated === true ? (<div>
              <FeathersRoute exact path="/" client={this.state.client} component={Login} />
              <FeathersRoute exact path="/courses" client={this.state.client} forRoles={["Instructor"]} component={ListCourses} />
              <FeathersRoute path="/create_course" client={this.state.client} forRoles={["Instructor"]} component={CreateCourseWizard} />
              <FeathersRoute path="/login" client={this.state.client} component={Login} />
              <FeathersRoute path="/:course/instructor/" client={this.state.client} forRoles={["Instructor"]} component={Instructor} />
              <FeathersRoute path="/:course/ta" client={this.state.client} forRoles={["Instructor", "TA"]} component={Ta} />
              <FeathersRoute path="/:course/student" client={this.state.client} forRoles={["Student"]} component={Student} />
              <FeathersRoute path="/:course/tickets" client={this.state.client} forRoles={["Instructor", "TA"]} component={TicketHistory} />
              <FeathersRoute path="/user" client={this.state.client} forRoles={["Instructor", "TA"]} component={UserDetails} />
            </div>
          ) : <Login client={this.state.client} />
          }

        </div>
      </div>
    </Router>
  )
  }
};

const FeathersRoute = ({ component: Component, client, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      (<Component {...props} client={client} course={getCourse(props)}/>)
    }
  />
)

const AuthenticatedRoute = ({ component: Component, client, ...rest }) => (
  <Route
    {...rest}
    render={props =>
      !! props.client.get('user') /* && props.forRoles.contains(props.user)*/ ? (
        <Component {...props} />
      ) : (
        <Redirect
          to={{
            pathname: "/",
            state: { from: props.location }
          }}
        />
      )
    }
  />
);

class Nav extends React.Component {
  constructor(props) {
    super(props);
    const possibleUser = props.client.get('user');
    this.state = {
      user: possibleUser,
      roles: []
    };

    if (!!possibleUser) {
      this.state.roles = [possibleUser.role];
    }

    props.client.on('authWithUser', (user) => {
      this.setState({user, roles: [user.role]});
    });
  }

  logout = () => {
    this.props.client.logout().then(() => {
      // TODO: probably handle global user state a better way
      window.location.reload();
    });
  }

  genLink = (path, name) => {
    const course = getCourse(this.props);
    return <li><Link to={`/${course}/${path}`}>{name}</Link></li>
  }

  // TODO: <li className="active"> <span className="sr-only">(current)</span>
  render() {
    const course = getCourse(this.props);

    return <nav className="navbar">
      <div className="container-fluid">
        <div className="navbar-header">
          <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <a className="navbar-brand dropdown-toggle" data-toggle="dropdown" href="#">
            { ((course && course.toUpperCase()) || '') + ' Office Hours'}
            <span className="caret"></span></a>
              <ul className="dropdown-menu" style={{marginLeft: "25px"}}>
                <li><a>Recent courses:</a></li>
                <li role="separator" className="divider"></li>
                <li><a href="#">CMSC330</a></li>
                <li><a href="#">CMSC131</a></li>
                <li role="separator" className="divider"></li>
                <li><Link to="/courses">All courses</Link></li>
                <li><Link to="/create_course">Manage CMSC131</Link></li>
                <li role="separator" className="divider"></li>
                <li><Link to="/create_course">+ New Course</Link></li>
              </ul>
        </div>
        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
          <ul className="nav navbar-nav">
            {
              !!course && this.state.roles.includes('Instructor') &&
                this.genLink('instructor', 'Instructor Home')
            }
            {
              !!course && (this.state.roles.includes('Instructor') || this.state.roles.includes('TA')) &&
                this.genLink('ta', 'TA Home')
            }
            {
              !!course && (this.state.roles.includes('Instructor') || this.state.roles.includes('TA')) &&
                this.genLink('tickets', 'Ticket History')
            }
            {
              !!course && (this.state.roles.includes('Student')) &&
                this.genLink('students', 'Home')
            }
            {
              !course && <li><Link to='/courses'>Select a course</Link></li>
            }
            <li><a className="oh-sched-link" href="#">OH Schedule</a></li>
          </ul>
          <ul className="nav navbar-nav navbar-right">
            {
              this.state.user && <li><a href="#" onClick={this.logout}>Logout</a></li>
            }
          </ul>
        </div>
      </div>
    </nav>
  }
}

const RoutedNav = withRouter(Nav);

export default App
