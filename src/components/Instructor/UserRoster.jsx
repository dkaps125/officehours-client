import React from 'react';
import toastr from 'toastr';
import { genUserElt, privForUser, courseForId } from '../../Utils';

class UserRoster extends React.Component {
  static defaultProps = {
    heading: 'All users'
  };

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

  deleteUser = user => {
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
      this.props.client
        .service('/users')
        .remove(user)
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
          {!userIsMe && amIUserAdmin ? (
            <a
              onClick={() => {
                this.deleteUser(user._id);
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
        <h3>{this.props.heading}</h3>
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
