import React from 'react';
import toastr from 'toastr';
import { roleForUser } from '../../Utils';

class UserAdd extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      role: 'Student',
      name: '',
      directoryID: ''
    };
  }

  handleInputChange = event => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (name === 'directoryID') {
      value = value.replace(/\s/g,'');
    }

    this.setState({
      [name]: value
    });
  };

  userCreate = event => {
    event.preventDefault();
    const { course, client } = this.props;

    if (!this.state.name || !this.state.directoryID || !this.state.role) {
      toastr.warning('Missing field in user creation form');
      return;
    }

    // this is in the Instructor page
    let roles = [];

    client.service('/users')
    .find({
      query: {
        directoryID: this.state.directoryID
      }
    }).then(res => {
      // user with this directory id is found
      if (res.data && res.data.length > 0) {
        // if this is not in the instr dashboard, we can't dupe a user
        if (!course) {
          toastr.error('This user already exists');
          return;
        }
        // check user already enrolled
        if (roleForUser(res.data[0], course)) {
          toastr.error('This user is already enrolled in this course');
          return;
        }

        // enroll
        client
          .service('/users')
          .patch(res.data[0]._id, {
            $push: {
              roles: {
                privilege: this.state.role,
                course: course._id
              }
            }
          })
          .then(res => {
            toastr.success(`User ${this.state.directoryID} already exists, adding to ${course.courseid}`);
            this.setState({ name: '', directoryID: '' });
            this.props.loadUserRoster();
          })
          .catch(err => {
            toastr.error(`Could not enroll user in course: ${err.toString()}`);
            console.error('userAdd', err);
          });

      } else {
        if (course) {
          roles = [
            {
              privilege: this.state.role,
              course: course._id
            }
          ];
        }

        const newUser = {
          name: this.state.name,
          directoryID: this.state.directoryID,
          roles
        };

        client
          .service('/users')
          .create(newUser)
          .then(res => {
            toastr.success('User ' + this.state.name + ' successfully created');
            this.setState({ name: '', directoryID: '' });
            this.props.loadUserRoster();
          })
          .catch(function(err) {
            toastr.error('Could not create user with this directory ID and name');
            console.error(err);
          });
      }
    })

  };

  render() {
    return (
      <form className="form-inline">
        <div className="form-group">
          <label htmlFor="userName">Name&nbsp;</label>
          <input
            type="text"
            autoComplete="off"
            className="form-control"
            name="name"
            placeholder="John Smith"
            value={this.state.name}
            onChange={this.handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="directoryID">&nbsp;Directory ID&nbsp;</label>
          <input
            type="text"
            autoComplete="off"
            className="form-control"
            name="directoryID"
            placeholder="example"
            value={this.state.directoryID}
            onChange={this.handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">&nbsp;Role&nbsp;</label>
          <select className="form-control" name="role" onChange={this.handleInputChange} value={this.state.role}>
            <option value="Student">Student</option>
            <option value="TA">TA</option>
            <option value="Instructor">Instructor</option>
          </select>
        </div>
        &nbsp;
        <button type="button" className="btn btn-default" onClick={this.userCreate}>
          {this.props.course ? 'Add user' : 'Create user'}
        </button>
      </form>
    );
  }
}

export default UserAdd;
