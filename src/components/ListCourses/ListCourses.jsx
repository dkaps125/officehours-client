import React from "react";
import toastr from "toastr";
import { Link } from "react-router-dom";

class ListCourses extends React.Component {
  state = {};

  componentDidMount() {
    this.getCourses();
  }

  getMyCourses = () => {
    const client = this.props.client;
    const user = client.get("user");
    return user.roles.map(role => {
      return role.course;
    });
  };

  getCourses = () => {
    const client = this.props.client;
    client
      .service("/courses")
      .find()
      .then(courses => {
        this.setState({ courses: courses.data });
        console.log(courses.data);
      })
      .catch(console.error);
  };

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
    this.props.history.push(course.courseid + "/" + this.routeForRole(this.props.client.get("user").role));
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

  render() {
    const user = this.props.client.get("user");
    return (
      <div className="row" style={{ paddingTop: "15px" }}>
        <div className="col-md-9">
          <h2>Select a course</h2>
          <br />
          {this.state.courses && this.state.courses.length > 0 ? (
            <ul>{this.state.courses.map(course => this.courseListing(course))}</ul>
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
