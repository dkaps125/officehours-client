import React from 'react';
import { Link } from 'react-router-dom';
import { getCourse, courseForId, routeForUser, hasAppPermission } from '../../Utils';

class ListCourses extends React.Component {

  componentDidMount() {
    console.log('CDM 1', this.props);
    if (this.props.course && this.props.popCourse) {
      console.log('CDM 2', this.props.popCourse);
      this.props.popCourse();
    }
  }

  getMyCourses = allCourses => {
    const { user } = this.props;

    if (!user || !user.roles || user.permissions.includes('admin')) {
      return allCourses;
    }
    return user.roles.map(role => {
      return courseForId(allCourses, role.course);
    });
  };

  courseListing = course => (
    <div className="panel panel-danger" key={course.courseid || course.toString()}>
      <div className="panel-heading">
        <h3 className="panel-title">{course.courseid}</h3>
      </div>
      <div
        onClick={() => {
          this.props.setCourse(course);
          const newRoute = routeForUser(this.props.user, course);
          this.props.history.replace(newRoute);
          localStorage.setItem('lastRoute', newRoute);
        }}
        style={{ cursor: 'pointer' }}
        className="panel-body"
      >
        {course.semester.term + ' ' + course.semester.year}
      </div>
    </div>
  );

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
        return;
      }
    });
  };

  render() {
    const { user } = this.props;
    const { allCourses } = this.props;
    // TODO: if not admin:
    const courses = this.getMyCourses(allCourses);
    // TODO: move to componentDidUpdate since this mutates state
    if (courses) {
      this.tryRedirectToCourseFromRoute(courses);
    }

    return (
      <div className="row" style={{ paddingTop: '15px' }}>
        <div className="col-md-9">
          <h2>Select a course</h2>
          {hasAppPermission(user, 'admin') && (
            <div className="alert alert-warning" role="alert">
              Viewing all available courses as admin (including courses you are not enrolled in)
            </div>
          )}
          <br />
          {courses && courses.length > 0 ? (
            <ul>{courses.map(course => this.courseListing(course))}</ul>
          ) : (
            <h4>
              <br /> No courses added yet
            </h4>
          )}
          {// instructor legacy, TODO remove
          (hasAppPermission(user, 'admin') || hasAppPermission(user, 'course_create')) && (
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
