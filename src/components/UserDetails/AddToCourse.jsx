import React from 'react';
import toastr from 'toastr';
import { courseForId, idForSoftCourseId, roleForUserDbId } from '../../Utils/';

//const AddToCourse = ({ queriedUser, allCourses, addToCourse }) => (
class AddToCourse extends React.Component {
  state = {
    courseid: '',
    privilege: 'Student'
  };
  handleInputChange = event => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  addToCourse = event => {
    event.preventDefault();
    const { client, queriedUser, allCourses } = this.props;

    const courseDbId = idForSoftCourseId(allCourses, this.state.courseid);

    if (!courseDbId) {
      toastr.error(`Cannot find course with id ${this.state.courseid}`);
      this.setState({ courseid: '' });
      return;
    }

    // TODO: this doesn't work
    if (!!roleForUserDbId(queriedUser, courseDbId)) {
      toastr.error(`User already enrolled in course ${this.state.courseid}`)
    }

    client
      .service('/users')
      .patch(queriedUser._id, {
        $push: {
          roles: {
            privilege: this.state.privilege,
            course: courseDbId
          }
        }
      })
      .then(res => {
        toastr.success(`User successfully enrolled in ${this.state.courseid}`);
        this.setState({ courseid: '' });
        this.props.updateUser();
      })
      .catch(err => {
        toastr.error(`Could not enroll user in course: ${err.toString()}`);
        console.log(err);
      });
  };

  render() {
    return (
      <div style={{ paddingBottom: '20px', paddingTop: '10px' }}>
        <form className="form form-inline">
          <strong style={{ marginRight: 10, fontSize: '16px' }}>Add to course:</strong>
          <input
            type="text"
            className="form-control"
            placeholder="CMSC123"
            name="courseid"
            style={{ marginRight: 10 }}
            onChange={this.handleInputChange}
            value={this.state.courseid}
          />
          <div className="form-group" style={{ marginRight: 10 }}>
            <label htmlFor="role">&nbsp;Role&nbsp;</label>
            <select
              className="form-control"
              name="privilege"
              onChange={this.handleInputChange}
              value={this.state.privilege}
            >
              <option value="Student">Student</option>
              <option value="TA">TA</option>
              <option value="Instructor">Instructor</option>
            </select>
          </div>
          <button type="submit" className="btn btn-default" onClick={this.addToCourse}>
            Enroll
          </button>
        </form>
      </div>
    );
  }
}

export default AddToCourse;
