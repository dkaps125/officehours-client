import React from 'react';
import toastr from 'toastr';
import { hasAppPermission } from '../../Utils';

class EditCourse extends React.Component {
  state = {
    title: null,
    ohURL: null,
    requiresPasscode: false,
    dailyTokens: null,
    studentMessaging: null
  };

  constructor(props) {
    super(props);
    const { course } = props;
    if (course) {
      this.state = {
        title: course.title,
        ohURL: course.ohURL,
        requiresPasscode: course.requiresPasscode,
        dailyTokens: course.dailyTokens,
      };
      if (course.studentMessaging) {
        this.state.studentMessaging = course.studentMessaging;
      }
    }
  }

  compoenntDidUpdate(oldProps) {
    if (oldProps.course != this.props.course) {
      const { course } = this.props;
      this.setState({
        title: course.title,
        ohURL: course.ohURL,
        requiresPasscode: course.requiresPasscode,
        dailyTokens: course.dailyTokens
      });
    }
  }

  handleInputChange = event => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  courseEdit = event => {
    event.preventDefault();
    const { course: oldCourse, client, setCourse } = this.props;
    client
      .service('/courses')
      .patch(oldCourse._id, this.state)
      .then(newCourse => {
        toastr.success('Course successfully changed');
        setCourse(newCourse);
      })
      .catch(err => {
        toastr.error('Could not modify course');
        console.log(err);
      });
  };

  deleteCourse = event => {
    event.preventDefault();
    const { course, client } = this.props;
    if (window.confirm("Are you sure you want to permanently delete this course")) {
      client
      .service('/courses')
      .remove(course._id)
      .then(res => {
        toastr.success('Course successfully deleted');
        const newRoute = '/courses'
        this.props.history.replace(newRoute);
        localStorage.setItem('lastRoute', newRoute);
        this.props.setCourse(null, true);

      })
      .catch(err => {
        toastr.error('Could not delete course');
        console.log(err);
      });
    }
  }

  render() {
    return (
      <div>
        <form>
          <div className="form-group">
            <label htmlFor="courseTitle">Course title</label>
            <input
              type="text"
              className="form-control"
              id="courseTitle"
              name="title"
              autoComplete="off"
              value={this.state.title}
              onChange={this.handleInputChange}
              maxLength={140}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ohURL">Link to office hours schedule</label>
            <input
              type="url"
              className="form-control"
              id="ohURL"
              name="ohURL"
              autoComplete="off"
              value={this.state.ohURL}
              onChange={this.handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="studentMessaging">Student Messaging</label>
            <input
              type="text"
              className="form-control"
              id="studentMessaging"
              name="studentMessaging"
              autoComplete="true"
              value={this.state.studentMessaging}
              onChange={this.handleInputChange}
              placeholder="Display a message to students before they submit a ticket"
              maxLength={300}
            />
          </div>
          <div className="form-group">
            <label htmlFor="dailyTokens">Tokens per day</label>
            <select
              className="form-control"
              id="dailyTokens"
              name="dailyTokens"
              value={this.state.dailyTokens}
              onChange={this.handleInputChange}
            >
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
              <option>7</option>
              <option>8</option>
              <option>9</option>
              <option>10</option>
              <option>15</option>
              <option>20</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="requiresPasscode">Require passcode &nbsp;</label>
            <input
              name="requiresPasscode"
              type="checkbox"
              id="requiresPasscode"
              checked={this.state.requiresPasscode}
              onChange={this.handleInputChange}
            />
          </div>
          <button type="submit" className="btn btn-default" onClick={this.courseEdit}>
            Submit edits
          </button>
        </form>
        {hasAppPermission(this.props.user, 'admin') && (
          <div style={{ marginTop: '15px' }}>
            <p>
              <strong>Admin only:</strong>
            </p>
            <button className="btn btn-warning" onClick={this.deleteCourse}>Delete {this.props.course.courseid}</button>
          </div>
        )}
      </div>
    );
  }
}

export default EditCourse;
