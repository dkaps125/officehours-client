import React from "react";
import ListCourses from "../components/ListCourses";

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
  },
  popCourse: () => {
    /*noop*/
  }
};

const UserContext = React.createContext(defaultContext);

const withUser = Component => props => (
  <UserContext.Consumer>{appData => <Component {...props} {...appData} />}</UserContext.Consumer>
);

const withUserRequireCourse = Component => props => (
  <UserContext.Consumer>
    {appData => (!!appData.course ? <Component {...props} {...appData} /> : <ListCourses {...props} {...appData} />)}
  </UserContext.Consumer>
);

export { defaultContext, UserContext, withUser, withUserRequireCourse };
