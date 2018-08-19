import React from 'react';
import toastr from "toastr";

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
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  userCreate = event => {
    event.preventDefault();

    if (!this.state.name || !this.state.directoryID || !this.state.role) {
      toastr.warning('Missing field in user creation form');
      return;
    }
    const roles = [
      {
        privilege: this.state.role,
        course: this.props.course._id
      }
    ];
    const newUser = {
      name: this.state.name,
      directoryID: this.state.directoryID,
      roles
    };

    this.props.client
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
          Create user
        </button>
      </form>
    );
  }
}

export default UserAdd;
