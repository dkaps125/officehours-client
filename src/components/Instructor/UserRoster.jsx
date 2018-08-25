import React from 'react';
import toastr from 'toastr';
import { genUserElt, privForUser, courseForId, roleForUser, hasAppPermission } from '../../Utils';

class UserRoster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayedRoster: props.userRoster,
      sortOrder: -1
    };
  }

  componentWillReceiveProps = nextProp => {
    if (nextProp.userRoster != this.props.userRoster) {
      this.setState({ displayedRoster: nextProp.userRoster });
    }
  };

  deleteFromCourse(role) {
    const { updateUser, client, queriedUser } = this.props;
  }

  deleteUser = user => {
    const { course, client } = this.props;

    if (course && window.confirm('Are you sure you want to remove this user from this course?')) {
      const role = roleForUser(user, course);

      if (!role) {
        console.error('no role', role);
        return;
      }
      client
        .service('/users')
        .patch(
          null,
          {
            $pull: { roles: { _id: role._id } }
          },
          {
            query: {
              _id: user._id,
              'roles._id': role._id
            }
          }
        )
        .then(user => {
          toastr.success('Successfully removed user from course');
          this.props.loadUser && this.props.loadUserRoster();
        })
        .catch(err => {
          toastr.error('Could not delete user. Ensure you have the correct user permissions');
          console.log(err);
        });

    }

    if (!course && window.confirm('Are you sure you want to permanently delete this user?')) {
      client
        .service('/users')
        .remove(user._id)
        .then(res => {
          toastr.success('User successfully removed');
          this.props.loadUser && this.props.loadUserRoster();
        })
        .catch(function(err) {
          toastr.error('Error removing user');
          console.error(err);
        });
    }
  };

  renderCoursesForUser = user => (
    <span>
      {user.roles.map(role => {
        const course = courseForId(this.props.allCourses, role.course);
        return (
          course && (
            <div styles={{ marginBottom: '10px' }} key={role._id}>
              <strong>{`${course.courseid}: `}</strong>
              {role.privilege}
            </div>
          )
        );
      })}
    </span>
  );

  sortTable = byColumn => {
    var sortColumn;

    if (byColumn === 0) {
      sortColumn = '_id';
    } else if (byColumn === 1) {
      sortColumn = 'directoryID';
    } else if (byColumn === 2) {
      sortColumn = 'name';
    }

    const compare = (a, b) => {
      if (!!sortColumn) {
        if (a[sortColumn] < b[sortColumn]) return this.state.sortOrder;
        else return -this.state.sortOrder;
      } else {
        if (privForUser(a, this.props.course) < privForUser(b, this.props.course)) return this.state.sortOrder;
        else return -this.state.sortOrder;
      }
    };

    this.setState({
      displayedRoster: this.state.displayedRoster.sort(compare),
      sortOrder: -this.state.sortOrder
    });
  };

  searchTable = queryEvent => {
    const query = queryEvent.target.value.toLowerCase();

    const searchResults = this.props.userRoster.filter(ele => {
      return ele.name.toLowerCase().includes(query) || ele.directoryID.includes(query);
    });

    this.setState({
      displayedRoster: searchResults
    });
  };

  renderUserRow = (user, row) => {
    const { course, noCourse } = this.props;
    const userIsMe = this.props.user._id === user._id;
    const amIUserAdmin = false; //TODO
    let role;
    if (course && !noCourse) {
      role = privForUser(user, course);
    }

    return (
      <tr key={row}>
        <td>{row + 1}</td>
        <td>
          {genUserElt(user, user.directoryID)}
          {userIsMe && <a style={{ color: 'gray' }}> (Me)</a>}
        </td>
        <td>
          {genUserElt(user, user.name || user.directoryID)}
          {userIsMe && <a style={{ color: 'gray' }}> (Me)</a>}
        </td>
        <td>{role || this.renderCoursesForUser(user)}</td>
        <td>
          {!userIsMe || (!course && !userIsMe && hasAppPermission(user, 'admin')) ? (
            <a
              onClick={() => {
                this.deleteUser(user);
              }}
            >
              Delete ✖
            </a>
          ) : (
            <a style={{ color: 'gray' }}>Delete ✖</a>
          )}
        </td>
      </tr>
    );
  };

  render() {
    return (
      <div>
        <form className="form-inline">
          <input type="text" className="form-control" onKeyUp={this.searchTable} placeholder="Search..." />
        </form>
        <table className="table table-striped" data-sortorder="1">
          <thead>
            <tr className="active">
              <th
                onClick={() => {
                  this.sortTable(0);
                }}
              >
                #
              </th>
              <th
                onClick={() => {
                  this.sortTable(1);
                }}
              >
                Directory ID
              </th>
              <th
                onClick={() => {
                  this.sortTable(2);
                }}
              >
                Name
              </th>
              <th
                onClick={() => {
                  this.sortTable(3);
                }}
              >
                Enrollment
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>{this.state.displayedRoster && this.state.displayedRoster.map(this.renderUserRow)}</tbody>
        </table>
      </div>
    );
  }
}

export default UserRoster;
