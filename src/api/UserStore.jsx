import React from "react";

const defaultContext = {
  user: null,
  authenticated: false,
  course: null,
  client: null,
  setCourse: () => {
    /*noop*/
  },
  logout: () => {
    /*noop*/
  }
};

const UserContext = React.createContext(defaultContext);

const withUser = Component => props => (
  <UserContext.Consumer>{appData => <Component {...props} {...appData} />}</UserContext.Consumer>
);

export { defaultContext, UserContext, withUser };
