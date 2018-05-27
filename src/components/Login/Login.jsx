import React from 'react';
import { Redirect } from 'react-router-dom';

class Login extends React.Component {

  constructor(props) {
    super(props);
    this.state = {};
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

  render() {
    if (!this.state.user) {
      return <main className="container login-container text-center">
        <div className="login-box">
          <div className="login-btn-box">
            <p className="lead">Log in with your university credentials</p>
          </div>
          <div className="login-btn-box login-btn">
            <a href="http://localhost:3030/cas_login" className="btn btn-info btn-lg" role="button">CAS Login</a>
          </div>
        </div>
      </main>
      //TODO: also check to see if window.location is valid for a route
    } else if (this.state.user.role === "Instructor" && window.location.pathname !== '/instructor') {
      console.log(window.location.pathname);
      return <Redirect to={{pathname:'/instructor', state: {from: window.location.pathname}}} />
    } else if (this.state.user.role === "TA" && window.location.pathname !== '/ta') {
      return <Redirect to={{pathname:'/ta', state: {from: this.props.location}}} />
    } else if (this.state.user.role === "Student" && window.location.pathname !== '/student') {
      return <Redirect to={{pathname:'/student', state: {from: window.location.pathname}}} />
    }
    return <div>Loading... </div>
  }
}

export default Login;
