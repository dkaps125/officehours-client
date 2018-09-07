import React from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import { __API } from '../../api/UserStore';

class Login extends React.Component {
  componentDidMount() {
    document.body.classList.add('login-body');
  }

  componentWillUnmount() {
    document.body.classList.remove('login-body');
  }

  handleLogin = event => {
    event.preventDefault();
    localStorage.setItem('lastRoute', window.location.pathname);

    window.location.href = `${__API}/cas_login`;
  };

  getNextRoute = () => {
    // invariant: this.state.user is a thing
    const route = localStorage.getItem('lastRoute');
    const course = localStorage.getItem('lastCourse');

    if ((!course && !route) || route === '/') {
      return '/courses';
    }
    return route;
  };

  render() {
    const { user, location } = this.props;
    var errorMsg;

    if (location.search === '?invalid') {
      errorMsg = (
        <div className="alert alert-danger">
          The directory ID you provided is not associated with any course. Please contact your professor.
        </div>
      );
    } else {
      errorMsg = <div />;
    }

    if (!user) {
      return (
        <main className="container login-container text-center">
          <div className="login-box">
            {errorMsg}
            <div className="login-btn-box">
              <p className="lead">Log in with your university credentials</p>
            </div>
            <div className="login-btn-box login-btn">
              <a className="btn btn-info btn-lg" role="button" onClick={this.handleLogin}>
                CAS Login
              </a>
            </div>
          </div>
        </main>
      );
      //TODO: also check to see if window.location is valid for a route
    } else {
      const nextRoute = this.getNextRoute();
      console.log('next rt', nextRoute);
      if (nextRoute && window.location.pathname !== nextRoute) {
        return <Redirect to={{ pathname: nextRoute, state: { from: window.location.pathname } }} />;
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
    return <div>Loading... </div>;
  }
}

const ConnectedLogin = withRouter(Login);

export default ConnectedLogin;
