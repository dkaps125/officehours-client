import React from "react";
import ListCourses from "../components/ListCourses";

const __API = window.__API;

const defaultContext = {
  api: __API,
  user: null,
  authenticated: false,
  course: null,
  client: null,
  recentCourses: [],
  allCourses: [],
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

export { defaultContext, UserContext, withUser, withUserRequireCourse, __API };
