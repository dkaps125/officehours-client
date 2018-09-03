import React from 'react';
import AvailableTas from '../AvailableTas';
import QueuedStudentsTable from '../QueuedStudentsTable';
import Comments from './Comments.jsx';
import toastr from 'toastr';
import { roleForUser } from '../../Utils';

const isOnDuty = (user, course) => user.onDuty && user.onDutyCourse === course._id;

class Ta extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      onDuty: false,
      numTas: 0,
      studentsInQueue: 0,
      studentQueue: [],
      currentTicket: null,
      onDutyCourse: null
    };
  }

  componentDidMount() {
    const { user, course } = this.props;
    this.setState({ numTas: 1, onDuty: isOnDuty(user, course) });
    this.getCurrentStudent();
  }

  queueUpdated = (studentQueue, studentsInQueue) => {
    this.setState({ studentsInQueue });
  };

  componentDidUpdate(prevProps, prevState) {
    // onDuty status updated
    if (!prevState.onDuty && this.state.onDuty) {
      if (this.props.course && this.props.course.requiresPasscode) {
        this.setPasscode();
      }
      this.getCurrentStudent();
    } else if (prevState.onDuty && !this.state.onDuty) {
      this.setState({ passcode: null });
    }
  }

  cancelAllTix = () => {
    const { client, course, user } = this.props;
    const warningMsg =
      'Warning: By ending office hours you will permanently cancel all tickets in the queue. Are you sure?';
    if (!this.state.currentTicket && window.confirm(warningMsg)) {
      client
        .service('/tokens')
        .patch(
          null,
          {
            cancelledByTA: true,
            fulfilled: true,
            fulfilledBy: user._id,
            fulfilledByName: user.name,
            isClosed: true,
            dequeuedAt: new Date(),
            closedAt: new Date()
          },
          {
            query: {
              $limit: 100,
              fulfilled: false,
              course: course._id
            }
          }
        )
        .then(tickets => {
          toastr.success('Successfully cancelled all tickets');
        })
        .catch(err => {
          toastr.error('Could not cancel all tickets');
          console.error(err);
        });
    }
  };

  toggleOH = () => {
    const { client, course, user, api } = this.props;
    const onDuty = !this.state.onDuty;

    fetch(`${api}/joinOH`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: client.get('jwt')
      },
      body: JSON.stringify({
        isOnDuty: onDuty,
        onDutyCourse: this.props.course._id
      })
    })
      .then(res => res.json())
      .then(onDutyStatus => {
        this.setState({ onDuty });
      })
      .catch(err => {
        console.error(err);
        toastr.error('Cound not update on duty status');
      });
    /*
    client
      .service('/users')
      .patch(user._id, { onDuty, onDutyCourse: course._id })
      .then(newMe => {
        onDuty ? toastr.success('You have joined office hours') : toastr.success('You have left office hours');
        this.setState({ onDuty });
      })
      .catch(err => {
        toastr.error('Cannot change on duty status');
        console.log('Toggle OH error', err);
      });
      */
  };

  getCurrentStudent = () => {
    const { client, course, user } = this.props;
    client
      .service('/tokens')
      .find({
        query: {
          $limit: 1,
          fulfilled: true,
          isBeingHelped: true,
          fulfilledBy: user._id,
          $sort: {
            createdAt: 1
          },
          cancelledByStudent: false,
          course: course._id
        }
      })
      .then(tickets => {
        // Have a current student
        let currentTicket = null;
        if (tickets.total > 0) {
          currentTicket = tickets.data[0];
        }
        this.setState({ currentTicket });
      });
  };

  dequeueStudent = () => {
    const { client, course } = this.props;
    client
      .service('/dequeue-student')
      .create({ course: course._id })
      .then(result => {
        this.getCurrentStudent();
      })
      .catch(err => {
        console.error('error dequeueStudent', err);
      });
  };

  setPasscode = () => {
    const { client, course } = this.props;

    client
      .service('/passcode')
      .get(course._id)
      .then(res => {
        this.setState({ passcode: res.passcode });
      });
  };

  markNoshow = () => {
    const { client, api } = this.props;
    if (this.state.currentTicket && window.confirm('Warning: Marking this student as a no show. Are you sure?')) {
      fetch(`${api}/markNoShow`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: client.get('jwt')
        },
        body: JSON.stringify({
          ticketId: this.state.currentTicket._id,
          userId: this.state.currentTicket.user._id
        })
      })
        .then(() => {
          this.getCurrentStudent();
          toastr.success('Student marked as a no-show and ticket closed');
        })
        .catch(err => {
          toastr.error('Could not mark ticket as no-show');
        });
    }
  };

  closeTicket = comment => {
    const { client, course, user, api } = this.props;
    if (!!this.state.currentTicket && window.confirm('Are you sure you want to permanently close this ticket?')) {
      // need: coure, ticket, comment, user,
      fetch(`${api}/closeTicket`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: client.get('jwt')
        },
        body: JSON.stringify({
          comment,
          ticketId: this.state.currentTicket._id,
          userId: this.state.currentTicket.user._id
        })
      })
        .then(updatedTicket => {
          toastr.success('Ticket closed and comment successfully saved');
          this.getCurrentStudent();
        })
        .catch(err => {
          toastr.error('Could not close ticket');
          console.error(err);
        });
    }
  };

  render() {
    const { client, course } = this.props;
    if (!client) {
      return <div>Loading...</div>;
    }
    return (
      <div className="row" style={{ paddingTop: '15px' }}>
        <div className="col-md-3">
          <AvailableTas {...this.props} />
          <hr />
          {this.state.onDuty ? (
            <div className="panel panel-default">
              <div className="panel-heading">You are hosting office hours</div>
              <div className="panel-body">
                {course.requiresPasscode && (
                  <React.Fragment>
                    <h4>Hourly passcode:</h4>
                    <h2 className="passcode">
                      <span className="label label-success">{this.state.passcode}</span>
                    </h2>
                    <hr />
                  </React.Fragment>
                )}
                <button onClick={this.toggleOH} className="btn btn-default">
                  Leave office hours
                </button>
                <div className="alert alert-success alert-dismissable" role="alert" style={{ marginTop: '15px' }}>
                  <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                  </button>
                  Do not forget to press the leave button before you depart.
                </div>
                <hr />
                <div id="end-oh-area">
                  <h4>End office hours:</h4>
                  <button onClick={this.cancelAllTix} className="btn btn-warning" style={{ marginTop: '10px' }}>
                    Cancel all tickets
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel panel-default">
              <div className="panel-heading">You are not in office hours</div>
              <div className="panel-body">
                <button onClick={this.toggleOH} className="btn btn-default">
                  Join office hours
                </button>
              </div>
            </div>
          )}
          <hr />
        </div>
        <div className="col-md-9">
          <p className="lead">
            Students in queue:&nbsp;
            <strong id="students-in-queue">{this.state.studentsInQueue}</strong>
          </p>
          <hr />
          {this.state.onDuty ? (
            <div>
              {this.state.currentTicket && (
                <Comments
                  ticket={this.state.currentTicket}
                  closeTicket={this.closeTicket}
                  markNoshow={this.markNoshow}
                  {...this.props}
                />
              )}

              <div id="student-queue-area" className="panel panel-default">
                <div className="panel-heading">Student queue</div>
                <div className="panel-body">
                  {this.state.studentsInQueue > 0 && (
                    <button onClick={this.dequeueStudent} className="btn btn-success" style={{ marginBottom: '15px' }}>
                      Dequeue Student
                    </button>
                  )}
                  <QueuedStudentsTable {...this.props} queueUpdated={this.queueUpdated} />
                </div>
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }
}

export default Ta;
