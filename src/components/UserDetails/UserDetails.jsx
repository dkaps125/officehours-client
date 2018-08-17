import React from 'react';
import { getUrlParameter, hasAppPermission } from '../../Utils';
import TicketHistory from '../TicketHistory';
import UserEdit from './UserEdit.jsx';
import toastr from 'toastr';

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
        this.toastAndUpdate('User successfully updated', this.loadUser);
      })
      .catch(() => {
        toastr.error('Could not update user');
      });
  };

  deleteUser = () => {
    const { user } = this.state;

    if (
      user &&
      window.confirm(
        'Are you sure you want to permanently delete ' + (this.state.user.name || this.state.user.directoryID)
      )
    ) {
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
        <div className="instr-sidebar-container col-xl-3 col-lg-3 col-md-3  device-xl device-lg device-md visible-xl visible-lg visible-md">
          <div className="affix">
            <h3>{user.name}</h3>
            <hr />
            <p>
              <strong>Directory ID:</strong> <span>{user.directoryID}</span>
            </p>
            <p>
              <strong>Role:</strong> <span>{user.role}</span>
            </p>
            <br />
            {!isThisMe && (
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
              <strong>Directory ID:</strong>
              {user.directoryID}
            </p>
            <p>
              <strong>Role:</strong>
              {user.role}
            </p>
            <br />
            {!isThisMe && (
              <button onClick={this.deleteUser} className="instr-only btn btn-warning">
                Delete user
              </button>
            )}
          </div>
        </div>
        <div className="col-xl-9 col-lg-9 col-md-9">
          {hasAppPermission(this.props.user, 'user_mod') && <UserEdit user={user} handleSubmit={this.handleSubmit} />}
          <hr />
          <div>TODO: put stats in & fix the below search func</div>
          {user.role === 'Student' ? (
            <TicketHistory client={this.props.client} student={user} searchBar={false} />
          ) : (
            <TicketHistory client={this.props.client} fulfilledBy={user} searchBar={false} />
          )}
        </div>
      </div>
    );
  }
}

export default UserDetails;
