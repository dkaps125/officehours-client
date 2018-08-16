import React from "react";
import { Link } from "react-router-dom";
import { getCourse } from "../../Utils";

class ListCourses extends React.Component {
  /*
  state = {};

  componentDidMount() {
    this.getCourses();
  }
  */

  // TODO: this should be taken care of by the back end
  getMyCourses = () => {
    const client = this.props.client;
    const user = client.get("user");
    return user.roles.map(role => {
      return role.course;
    });
  };

  /*
  getCourses = () => {
    const client = this.props.client;
    client
      .service("/courses")
      .find()
      .then(courses => {
        this.setState({ courses: courses.data });
      })
      .catch(console.error);
  };
  */

  routeForRole = role => {
    switch (role) {
      case "Admin":
      case "Instructor":
        return "instructor";
        break;
      case "TA":
        return "ta";
        break;
      case "Student":
      default:
        return "student";
    }
  };

  selectCourse = course => {
    this.props.setCourse(course);
    this.props.history.replace(course.courseid + "/" + this.routeForRole(this.props.client.get("user").role));
  };

  courseListing = course => {
    return (
      <div className="panel panel-danger" key={course.courseid || course.toString()}>
        <div className="panel-heading">
          <h3 className="panel-title">{course.courseid}</h3>
        </div>
        <div
          onClick={() => {
            this.selectCourse(course);
          }}
          style={{ cursor: "pointer" }}
          className="panel-body"
        >
          {course.semester.term + " " + course.semester.year}
        </div>
      </div>
    );
  };

  // This may belong somewhere else, but with the current course routing logic it works ¯\_(ツ)_/¯
  tryRedirectToCourseFromRoute = courses => {
    // only slightly dirty
    const course = getCourse(this.props);
    if (!course) {
      return;
    }

    courses.map(curCourse => {
      // theoretically a match
      if (curCourse.courseid.toLowerCase() === course.toLowerCase()) {
        this.props.setCourse(curCourse);
        this.props.history.push(this.props.location.pathname);
        return;
      }
    });
  };

  render() {
    const { user } = this.props;
    const { allCourses: courses } = this.props;
    // TODO: move to componentDidUpdate since this mutates state
    if (courses) {
      this.tryRedirectToCourseFromRoute(courses);
    }

    return (
      <div className="row" style={{ paddingTop: "15px" }}>
        <div className="col-md-9">
          <h2>Select a course</h2>
          <br />
          {courses && courses.length > 0 ? (
            <ul>{courses.map(course => this.courseListing(course))}</ul>
          ) : (
            <h4>
              <br /> No courses added yet
            </h4>
          )}
          {// instructor legacy, TODO remove
          (user.role === "Instructor" || user.role === "Admin") && (
            <Link className="btn btn-info btn-lg fixedButton" to="/create_course">
              <strong>+</strong> Course
            </Link>
          )}
        </div>
      </div>
    );
  }
}

export default ListCourses;
