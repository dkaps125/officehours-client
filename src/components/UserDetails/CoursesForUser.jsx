import React from 'react';
import toastr from 'toastr';
import { courseForId } from '../../Utils/';

//const CoursesForUser = ({ queriedUser, allCourses }) => (
class CoursesForUser extends React.Component {
  selectRole = (event, roleId) => {
    const { updateUser, client, queriedUser } = this.props;
    client
      .service('/users')
      .patch(
        null,
        {
          $set: { 'roles.$.privilege': event.target.value }
        },
        {
          query: {
            _id: queriedUser._id,
            'roles._id': roleId
          }
        }
      )
      .then(user => {
        toastr.success('Successfully updated user privilege');
        if (updateUser) {
          updateUser();
        }
      })
      .catch(err => {
        toastr.error('Could not update user privilege. Please ensure you have access to this course');
        console.log(err);
      });
  };

  deleteFromCourse(role) {
    const { updateUser, client, queriedUser } = this.props;
    client.service('/users').patch(
      null,
      {
        $pull: { roles: { "_id": role._id } }
      },
      {
        query: {
          _id: queriedUser._id,
          'roles._id': role._id
        }
      }
    )
    .then(user => {
      toastr.success('Successfully removed user from course');
      if (updateUser) {
        updateUser();
      }
    })
    .catch(err => {
      toastr.error('Could not delete user. Ensure you have the correct user permissions');
      console.log(err);
    });
  }

  render() {
    const { queriedUser, allCourses } = this.props;
    return (
      <table className="table table-condensed">
        <thead>
          <tr className="active">
            <th>Course</th>
            <th>Privilege</th>
            <th>Total tickets</th>
            <th>Remove from course</th>
          </tr>
        </thead>
        <tbody>
          {queriedUser &&
            queriedUser.roles &&
            queriedUser.roles.map((role, index) => (
              <tr key={role._id}>
                <td>{courseForId(allCourses, role.course) ? courseForId(allCourses, role.course).courseid : role.course}</td>
                <td>
                  {/*<select value={this.state.roles.get(index).selected} /> */}
                  <select value={role.privilege} onChange={event => this.selectRole(event, role._id)}>
                    <option value="Student">Student</option>
                    <option value="TA">TA</option>
                    <option value="Instructor">Instructor</option>
                  </select>
                </td>
                <td>{role.totalTickets}</td>
                <td>
                  <a
                    href="#"
                    onClick={() => {
                      this.deleteFromCourse(role);
                    }}
                  >
                    Delete
                  </a>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  }
}

export default CoursesForUser;
