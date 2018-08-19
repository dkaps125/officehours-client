import React from "react";
import toastr from "toastr";

class UserBulkDeletion extends React.Component {
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

  render() {
    return (
      <div>
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

export default UserBulkDeletion;
