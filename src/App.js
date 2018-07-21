import React from "react";
import { BrowserRouter as Router, Route, Link, Redirect, withRouter } from "react-router-dom";
import Ta from "./components/Ta";
import Student from "./components/Student";
import Login from "./components/Login";
import Instructor from "./components/Instructor";
import TicketHistory from "./components/TicketHistory";
import UserDetails from "./components/UserDetails";
//import ManageCourses from './components/ManageCourses';
import CreateCourseWizard from "./components/CreateCourseWizard";
import ListCourses from "./components/ListCourses";
import { getCourse } from "./Utils";

import { defaultContext, UserContext, withUser } from "./api/UserStore";

const io = require("socket.io-client");
const feathers = require("@feathersjs/feathers");
const socketio = require("@feathersjs/socketio-client");
const auth = require("@feathersjs/authentication-client");

class App extends React.Component {
  setCourse = course => {
    localStorage.setItem("lastCourse", course.courseid);
    this.setState({course});
  };

  logout = () => {
    this.state.client &&
      this.state.client.logout().then(() => {
        // TODO: probably handle global user state a better way
        window.location.reload();
      });
  };

  constructor(props) {
    super(props);

    const socket = io("http://localhost:3030", {
      secure: true,
      transports: ["websocket"],
      forceNew: true
    });
    const client = feathers()
      .configure(socketio(socket))
      .configure(
        auth({
          cookie: "feathers-jwt"
        })
      );
    client.set("socket", socket);

    this.state = Object.assign(defaultContext, { client, setCourse: this.setCourse, logout: this.logout });

    const users = client.service("/users");
    // Try to authenticate with the JWT stored in localStorage
    client
      .authenticate()
      .then(response => {
        console.info("authenticated successfully");
        client.set("jwt", response.accessToken);
        return client.passport.verifyJWT(response.accessToken);
      })
      .then(payload => {
        console.info("verified JWT");
        return users.get(payload.userId);
      })
      .then(user => {
        client.set("user", user);
        // TODO: phase out this garbage global call
        client.emit("authWithUser", user);
        this.setState({ user, authenticated: true });
        client.on("reauthentication-error", (err) => {
          console.error("Reauth error", err);
          this.setState({ user: null, authenticated: false });
        });
      })
      .catch(err => {
        if (err.name === "NotAuthenticated") {
          this.setState({ user: null, authenticated: false });
        } else {
          console.error('Error on feathers auth:',err);
        }
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
                  <ConnectedRoute exact path="/courses" forRoles={["Instructor"]} component={ListCourses} />
                  <ConnectedRoute path="/create_course" forRoles={["Instructor"]} component={CreateCourseWizard} />
                  <ConnectedRoute path="/login" component={Login} />
                  <ConnectedRoute path="/:course/instructor/" forRoles={["Instructor"]} component={Instructor} />
                  <ConnectedRoute path="/:course/ta" forRoles={["Instructor", "TA"]} component={Ta} />
                  <ConnectedRoute path="/:course/student" forRoles={["Student"]} component={Student} />
                  <ConnectedRoute path="/:course/tickets" forRoles={["Instructor", "TA"]} component={TicketHistory} />
                  <ConnectedRoute path="/user" forRoles={["Instructor", "TA"]} component={UserDetails} />
                </React.Fragment>
              ) : (
                <Login client={this.state.client} />
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

class Nav extends React.Component {
  constructor(props) {
    super(props);
    const { user } = this.props;
    this.state = {
      user,
      roles: []
    };

    if (!!user) {
      this.state.roles = [user.role];
    }
  }

  genLink = (path, name) => {
    const { course } = this.props;

    return course && course.courseid && (
      <li>
        <Link to={`/${course.courseid}/${path}`}>{name}</Link>
      </li>
    );
  };

  // TODO: <li className="active"> <span className="sr-only">(current)</span>
  render() {
    console.log("props in nav bar", this.props);
    const course = getCourse(this.props);
    const { user } = this.props;

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
              {((course && course.toUpperCase()) || "") + " Office Hours"}
              <span className="caret" />
            </a>
            <ul className="dropdown-menu" style={{ marginLeft: "25px" }}>
              <li>
                <a>Recent courses:</a>
              </li>
              <li role="separator" className="divider" />
              <li>
                <a href="#">CMSC330</a>
              </li>
              <li>
                <a href="#">CMSC131</a>
              </li>
              <li role="separator" className="divider" />
              <li>
                <Link to="/courses">All courses</Link>
              </li>
              <li>
                <Link to="/create_course">Manage CMSC131</Link>
              </li>
              <li role="separator" className="divider" />
              <li>
                <Link to="/create_course">+ New Course</Link>
              </li>
            </ul>
          </div>
          <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul className="nav navbar-nav">
              {!!course && this.state.roles.includes("Instructor") && this.genLink("instructor", "Instructor Home")}
              {!!course &&
                (this.state.roles.includes("Instructor") || this.state.roles.includes("TA")) &&
                this.genLink("ta", "TA Home")}
              {!!course &&
                (this.state.roles.includes("Instructor") || this.state.roles.includes("TA")) &&
                this.genLink("tickets", "Ticket History")}
              {!!course && this.state.roles.includes("Student") && this.genLink("students", "Home")}
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
                  <a href="#" onClick={this.logout}>
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
