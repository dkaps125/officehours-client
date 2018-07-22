import React from 'react';
import { Redirect } from 'react-router-dom';
import AvailableTas from '../AvailableTas';
import QueuedStudentsTable from '../QueuedStudentsTable';

import UserManage from './UserManage.jsx';
import UserRoster from './UserRoster.jsx';
import StudentStats from './StudentStats.jsx';
import toastr from 'toastr';

class Instructor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      studentQueue: [],
      userRoster: []
    };

    const socket = props.client.get('socket');
    socket.on('users created', this.loadUserRoster);
    socket.on('users patched', this.loadUserRoster);
    this.loadUserRoster();

    // Don't toast because QueuedStudentsTable toasts for us
  }

  componentWillUnmount() {
    const socket = this.props.client.get('socket');
    socket.removeListener('users created', this.loadUserRoster);
    socket.removeListener('users patched', this.loadUserRoster);
  }

  loadUserRoster = () => {
    // TODO: these kinds of service calls belong in their own API file with exposed hooks
    // they can then be shoved into a context and be told to refresh when needed.
    // This is bad design.
    this.props.client.service('/users').find(
      {query: {$limit: 5000, $sort: {createdAt: -1}}}
    ).then(results => {
      this.setState({userRoster:results.data})
    })
  }

  render() {
    const client = this.props.client;
    return <div className="row" style={{paddingTop:"15px"}}>
      {this.props.authenticated === false && <Redirect to='/login' />}
      <div className="col-md-3">
        <h3>Dashboard</h3>
        <AvailableTas client={client} hideCount />
      </div>
      <div className="col-md-9">
        <h3>Live student queue</h3>
        <QueuedStudentsTable {...this.props} />
        <hr />
        <StudentStats {...this.props} />
        <hr />
        <UserManage {...this.props} loadUserRoster={this.loadUserRoster} />
        <hr />
        <UserRoster {...this.props} userRoster={this.state.userRoster}
          loadUserRoster={this.loadUserRoster} />
      </div>
    </div>
  }
}

export default Instructor;
