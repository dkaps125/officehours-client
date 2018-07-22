import React from 'react';
import { Redirect } from 'react-router-dom';

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
    // this isn't good practice, should grab user upstream & update from props
    if (!!props.client) {
      props.client.on('authWithUser', (user) => {
        this.setState({user});
      });

    }
  }

  componentDidMount() {
    document.body.classList.add('login-body');
  }

  componentWillUnmount() {
    document.body.classList.remove('login-body');
  }

  handleLogin = (event) => {
    event.preventDefault();
    localStorage.setItem('lastRoute', window.location.pathname);

    window.location.href = "http://localhost:3030/cas_login";
  }

  getNextRoute = () => {
    // invariant: this.state.user is a thing
    const route = localStorage.getItem('lastRoute');
    const course = localStorage.getItem('lastCourse');

    if ((!course && !route) || (route === '/')) {
      return '/courses';
    }
    return route;
  }

  render() {
    if (!this.state.user) {
      return <main className="container login-container text-center">
        <div className="login-box">
          <div className="login-btn-box">
            <p className="lead">Log in with your university credentials</p>
          </div>
          <div className="login-btn-box login-btn">
            <a className="btn btn-info btn-lg" role="button" onClick={this.handleLogin}>CAS Login</a>
          </div>
        </div>
      </main>
      //TODO: also check to see if window.location is valid for a route
    } else {
      const nextRoute = this.getNextRoute();
      if (!!nextRoute && window.location.pathname !== nextRoute) {
        return <Redirect to={{pathname:nextRoute, state: {from: window.location.pathname}}} />;
      } else {
        //return <Redirect to={{pathname:'/courses', state: {from: window.location.pathname}}} />;
      }
        /*
        if (this.state.user.role === "Instructor") {
          return <Redirect to={{pathname:'/instructor', state: {from: window.location.pathname}}} />;
        } else if (this.state.user.role === "TA") {
          return <Redirect to={{pathname:'/ta', state: {from: this.props.location}}} />
        } else if (this.state.user.role === "Student") {
          return <Redirect to={{pathname:'/student', state: {from: window.location.pathname}}} />
        }
      }
      */
    }
    return <div>Loading... </div>
  }
}

export default Login;
