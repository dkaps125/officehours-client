import React from 'react';
import toastr from 'toastr';
import { getUrlParameter, hasAppPermission } from '../../Utils';
import TicketHistory from '../TicketHistory';
import CoursesForUser from './CoursesForUser.jsx';
import UserEdit from './UserEdit.jsx';
import AddToCourse from './AddToCourse.jsx';
import SelectPermissions from './SelectPermissions.jsx';

class UserDetails extends React.Component {
  state = { user: null };

  componentDidMount() {
    if (!this.state.user) {
      this.loadUser();
    }
  }

  loadUser = () => {
    const { client } = this.props;
    const userId = getUrlParameter(this.props.location.search, 'id');

    client
      .service('/users')
      .get(userId)
      .then(user => {
        if (user.role !== 'Student' && client.get('user').role === 'TA') {
          /* no-op */
          return;
        }
        this.setState({ user });
      })
      .catch(console.error);
  };

  toastAndUpdate = (msg, cb) => {
    toastr.success(msg);
    cb();
  };

  handleSubmit = (oldUser, newUser) => {
    const { client } = this.props;

    client
      .service('/users')
      .patch(oldUser._id, newUser)
      .then(() => {
        toastr.success('User successfully updated');
        this.loadUser();
      })
      .catch(() => {
        toastr.error('Could not update user');
      });
  };

  deleteUser = () => {
    const { user } = this.state;
    const deletionMessage = `Are you sure you want to permanently delete ${user.name || user.directoryID}`;

    if (user && window.confirm(deletionMessage)) {
      this.props.client
        .service('/users')
        .remove(user._id)
        .then(() => {
          toastr.success('User successfully deleted');
          this.setState({ user: null });
        })
        .catch(err => {
          toastr.error('Could not delete user');
        });
    }
  };

  render() {
    const userId = getUrlParameter(this.props.location.search, 'id');
    const { user } = this.state;

    if (!user) {
      return (
        <div>
          <h2>User not found</h2>
        </div>
      );
    }

    const isThisMe = this.props.user._id === this.state.user._id;

    return (
      <div className="row" style={{ paddingTop: '15px' }}>
        <div className="instr-sidebar-container col-xl-3 col-lg-3 col-md-3 device-xl device-lg device-md visible-xl visible-lg visible-md">
          <div className="affix">
            <h3>{user.name}</h3>
            <hr />
            <p>
              <strong>Directory ID:</strong> <span>{user.directoryID}</span>
            </p>
            {user.permissions &&
              user.permissions.length && (
                <div>
                  <p><strong>Privileges:</strong></p>
                  <span>{user.permissions.map(perm => <p key={perm + '_permsb'}>✔️ {perm}</p>)}</span>
                </div>
              )}
            <br />
            {!isThisMe &&
              hasAppPermission(this.props.user, 'admin') && (
                <button onClick={this.deleteUser} className="instr-only btn btn-warning">
                  Delete user
                </button>
              )}
          </div>
        </div>
        <div className="col-md-3 device-sm device-xs visible-sm visible-xs">
          <div className="sidebar-nav" id="userdetail-sidebar-sm">
            <h3>{user.name}</h3>
            <hr />
            <p>
              <strong>Directory ID: </strong>
              {user.directoryID}
            </p>
            <br />
            {!isThisMe && (
              <button onClick={this.deleteUser} className="btn btn-warning">
                Delete user
              </button>
            )}
          </div>
        </div>
        <div className="col-xl-9 col-lg-9 col-md-9">
          <h2>User details</h2>
          <hr />
          {hasAppPermission(this.props.user, 'user_mod') && (
            <React.Fragment>
              <UserEdit user={user} handleSubmit={this.handleSubmit} noRole />
              <hr />
            </React.Fragment>
          )}
          {hasAppPermission(this.props.user, 'user_mod') && (
            <React.Fragment>
              <h3>Course Enrollment</h3>
              <AddToCourse {...this.props} updateUser={this.loadUser} queriedUser={user} />
              <CoursesForUser {...this.props} updateUser={this.loadUser} queriedUser={user} />
            </React.Fragment>
          )}
          {hasAppPermission(this.props.user, 'admin') && (
            <React.Fragment>
              <hr />
              <h3>Global app permissions</h3>
              <SelectPermissions {...this.props} updateUser={this.loadUser} queriedUser={user} />
            </React.Fragment>
          )}
          <hr />
          <h3>Stats</h3>
          {/*TODO: do this after August 2018 rollout */}
          <div className="well">Coming soon</div>
          <TicketHistory {...this.props} queriedUser={user} searchBar={false} />
        </div>
      </div>
    );
  }
}

export default UserDetails;
