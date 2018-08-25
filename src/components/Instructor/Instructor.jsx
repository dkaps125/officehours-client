import React from 'react';
import { Redirect } from 'react-router-dom';
import AvailableTas from '../AvailableTas';
import QueuedStudentsTable from '../QueuedStudentsTable';

import UserBulkDeletion from './UserBulkDeletion.jsx';
import UserRoster from './UserRoster.jsx';
import StudentStats from './StudentStats.jsx';
import CSVUpload from './CSVUpload.jsx';
import UserAdd from './UserAdd.jsx';
import EditCourse from './EditCourse.jsx';

import {hasAppPermission, isInstructor} from '../../Utils';

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
    this.props.client
      .service('/users')
      .find({
        query: {
          roles: {
            $elemMatch: {
              course: this.props.course._id
            }
          },
          $limit: 5000,
          $sort: { createdAt: -1 }
        }
      })
      .then(results => {
        this.setState({ userRoster: results.data });
      });
  };

  render() {
    const { client, course } = this.props;
    return (
      <div className="row" style={{ paddingTop: '15px' }}>
        {this.props.authenticated === false && <Redirect to="/login" />}
        <div className="col-md-3">
          <h3>{course.courseid && course.courseid.toUpperCase()} Dashboard</h3>
          <AvailableTas {...this.props} hideCount />
        </div>
        <div className="col-md-9">
          <h3>Dashboard for {`"${this.props.course.title}"`}</h3>
            {hasAppPermission(this.props.user, 'admin') &&
              !isInstructor(this.props.user, course) && (
                <div className="alert alert-warning">
                  <strong>Viewing course as admin:</strong> You are not enrolled in this course. If you wish to submit tickets, please enroll.
                </div>
              )}
          <EditCourse {...this.props} />
          <hr />
          <h3>Live student queue</h3>
          <QueuedStudentsTable {...this.props} />
          <hr />
          <StudentStats {...this.props} />
          <hr />
          <h3>Add user</h3>
          <UserAdd {...this.props} loadUserRoster={this.loadUserRoster} />
          <hr />
          <h3>Bulk user creation</h3>
          <CSVUpload {...this.props} loadUserRoster={this.loadUserRoster} />
          <hr />
          <h3>Bulk user deletion</h3>
          <UserBulkDeletion {...this.props} loadUserRoster={this.loadUserRoster} />
          <hr />
          <h3>All users in {this.props.course.courseid}</h3>
          <UserRoster {...this.props} userRoster={this.state.userRoster} loadUserRoster={this.loadUserRoster} />
        </div>
      </div>
    );
  }
}

export default Instructor;
