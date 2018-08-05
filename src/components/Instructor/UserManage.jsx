import React from "react";
import CSVUpload from "./CSVUpload.jsx";
import toastr from "toastr";

class UserManage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      role: "Student",
      name: "",
      directoryID: ""
    };
  }

  handleInputChange = event => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  };

  deleteAllWithRole = role => {
    this.props.client
      .service("/users")
      .remove(null, {
        query: {
          roles: {
            $elemMatch: {
              course: this.props.course._id,
              privilege: role
            }
          }
        }
      })
      .then(res => {
        this.props.loadUserRoster();
        toastr.success("Successfully deleted users");
      })
      .catch(err => {
        console.err(err);
      });
  };

  deleteAllStudents = event => {
    if (window.confirm("Are you sure you want to permanently delete ALL students?")) {
      this.deleteAllWithRole("Student");
    }
  };

  deleteAllTAs = event => {
    if (window.confirm("Are you sure you want to permanently delete ALL TA's?")) {
      this.deleteAllWithRole("TA");
    }
  };

  userCreate = event => {
    event.preventDefault();

    if (!this.state.name || !this.state.directoryID || !this.state.role) {
      toastr.warning("Missing field in user creation form");
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
      .service("/users")
      .create(newUser)
      .then(res => {
        toastr.success("User " + this.state.name + " successfully created");
        this.setState({ name: "", directoryID: "" });
        this.props.loadUserRoster();
      })
      .catch(function(err) {
        toastr.error("Could not create user with this directory ID and name");
        console.error(err);
      });
  };

  render() {
    return (
      <div>
        <hr id="manage-user" />
        <h3>Add user</h3>
        <form className="form-inline">
          <div className="form-group">
            <label htmlFor="userName">Name&nbsp;</label>
            <input
              type="text"
              autocomplete="off"
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
              autocomplete="off"
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
        <hr />
        <h3>Bulk user creation</h3>
        <a href="example.csv">Download example CSV file</a>
        <p>
          Upload a CSV, must be comma separated. Names cannot contain commas.
          <br />
          Only include columns:
          <strong>name,directoryID,role</strong>
          where role is either "Instructor", "Student", or "TA"
        </p>
        <br />
        <CSVUpload {...this.props} />
        <hr />
        <h3>Bulk user deletion</h3>
        <button onClick={this.deleteAllStudents} className="btn btn-warning">
          Delete all students
        </button>
        &nbsp;
        <button onClick={this.deleteAllTAs} className="btn btn-warning">
          Delete all TAs
        </button>
      </div>
    );
  }
}

export default UserManage;
