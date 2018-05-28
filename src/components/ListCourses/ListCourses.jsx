import React from 'react';
import toastr from 'toastr';
import { Link } from 'react-router-dom';

class ListCourses extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };

  }

  componentWillUnmount() {

  }

  componentDidMount() {
    this.getCourses();
  }

  componentDidUpdate(prevProps, prevState) {

  }

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  }

  getMyCourses = () => {
    const client = this.props.client;
    const user = client.get('user');
    return user.roles.map(role => {
      return role.course;
    });
  }

  getCourses = () => {
    const client = this.props.client;
    client.service('/courses').find()
    .then(courses => {
      this.setState({courses: courses.data});
      console.log(courses.data);
    }).catch(console.error);
  }

  render() {
    const user = this.props.client.get('user');
    return <div className="row" style={{paddingTop:"15px"}}>
      <div className="col-md-9">
        <h2>Select a course</h2>
        <br />
        {
          !!this.state.courses ? <ul>{this.state.courses.map(course => {
            return <div className="panel panel-danger" key={course.toString()}>
              <div className="panel-heading">
                <h3 className="panel-title">{course.courseid}</h3>
              </div>
              <div className="panel-body">
                {course.semester.term + ' ' + course.semester.year}
              </div>

            </div>
          })}</ul> : <h4><br />No courses available</h4>
        }
        {
          // instructor legacy, TODO remove
          (user.role === 'Instructor' || user.role === 'Admin') &&
          <Link className="btn btn-info btn-lg fixedButton" to='/courses/create'>
            <strong>+</strong> Course
          </Link>
        }
      </div>
    </div>
  }
}

export default ListCourses;
